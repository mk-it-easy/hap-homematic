/*
 * File: HomeMaticDimmerAccessory.js
 * Project: hap-homematic
 * File Created: Friday, 1st May 2020 2:16:09 pm
 * Author: Thomas Kluge (th.kluge@me.com)
 * -----
 * The MIT License (MIT)
 *
 * Copyright (c) Thomas Kluge <th.kluge@me.com> (https://github.com/thkl)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 * ==========================================================================
 */

const path = require('path')
const HomeMaticAccessory = require(path.join(__dirname, 'HomeMaticAccessory.js'))

class HomeMaticDimmerAccessory extends HomeMaticAccessory {
  publishServices (Service, Characteristic) {
    let self = this
    this.oldLevel = 1
    this.debugLog('creating Service')
    this.delayOnSet = 500
    let settings = this.getDeviceSettings()
    this.useRampTime = settings.useRampTime || false
    this.rampTime = settings.rampTime || 500
    this.onTime = this.getDeviceSettings().OnTime

    self.debugLog('Init light RampTime %s onTime %s', this.rampTime, this.onTime)

    this.lightBulbService = this.getService(Service.Lightbulb)

    this.isOnCharacteristic = this.lightBulbService.getCharacteristic(Characteristic.On)

      .on('get', async (callback) => {
        let value = await self.getValueForDataPointNameWithSettingsKey('level', null, true)
        if (callback) {
          callback(null, parseFloat(value) > 0)
        }
      })

      .on('set', (value, callback) => {
        self.debugLog('set ON %s', value)
        self.isWorking = true
        self.lightWasTurnedOn = value
        clearTimeout(self.timer)
        self.timer = setTimeout(async () => {
          self.debugLog('OnTime is %s LWTO is %s', self.onTime, self.lightWasTurnedOn)
          if ((self.lightWasTurnedOn === true) && (self.onTime !== undefined) && (parseInt(self.onTime) > 0)) {
            self.debugLog('set OnTime to %s', self.onTime)
            await self.setValue('ON_TIME', self.onTime)
          }

          if (self.useRampTime === true) {
            await self.setValueForDataPointNameWithSettingsKey('ramp', null, parseFloat(self.rampTime) / 1000)
          }

          if (value === false) {
            self.setValueForDataPointNameWithSettingsKey('level', null, 0)
          } else {
            if (self.oldLevel === 0) {
              self.oldLevel = 1
            }
            self.setValueForDataPointNameWithSettingsKey('level', null, self.oldLevel)
          }
        }, self.delayOnSet)
        self.debugLog('LWTO is %s', self.lightWasTurnedOn)
        if (callback) {
          callback()
        }
      })

    this.isOnCharacteristic.eventEnabled = true

    this.brightnessCharacteristic = this.lightBulbService.addCharacteristic(Characteristic.Brightness)

      .on('get', async (callback) => {
        let value = await self.getValueForDataPointNameWithSettingsKey('level', null, true)
        if (callback) {
          callback(null, parseFloat(value) * 100)
        }
      })

      .on('set', (value, callback) => {
        let hkvalue = parseFloat(value) / 100
        self.oldLevel = hkvalue
        clearTimeout(self.timer)
        self.timer = setTimeout(async () => {
          self.debugLog('set bn %s', hkvalue)
          // do this just once
          self.debugLog('OnTime is %s LWTO is %s', self.onTime, self.lightWasTurnedOn)
          if ((self.lightWasTurnedOn === true) && (self.onTime !== undefined) && (parseInt(self.onTime) > 0)) {
            self.debugLog('set OnTime to %s', self.onTime)
            await self.setValue('ON_TIME', self.onTime)
          }
          self.lightWasTurnedOn = false
          self.isWorking = true
          if (self.useRampTime === true) {
            await self.setValueForDataPointNameWithSettingsKey('ramp', null, parseFloat(self.rampTime) / 1000)
          }
          await self.setValueForDataPointNameWithSettingsKey('level', null, hkvalue)
        }, self.delayOnSet)
        if (callback) {
          callback()
        }
      })

    this.brightnessCharacteristic.eventEnabled = true

    this.registerAddressWithSettingsKeyForEventProcessingAtAccessory('working', null, (newValue) => {
      self.debugLog('working event  %s', newValue)
      self.isWorking = self.isTrue(newValue)
      if (!self.isWorking) {
        // make a final call
        self.getValueForDataPointNameWithSettingsKey('level', null, true)
      }
    })

    this.registerAddressWithSettingsKeyForEventProcessingAtAccessory('level', null, (newValue) => {
      self.debugLog('event Level %s', parseFloat(newValue))
      if (self.isWorking !== true) {
        let lvl = parseFloat(newValue) * 100
        let isOn = (lvl > 0)
        self.debugLog('update On to  %s', isOn)
        self.isOnCharacteristic.updateValue(isOn)
        self.debugLog('update brightnessCharacteristic to  %s', lvl)
        self.brightnessCharacteristic.updateValue(lvl)
      }
    })
  }

  shutdown () {
    clearTimeout(this.timer)
  }

  initServiceSettings () {
    return {
      'DIMMER': {
        level: {name: 'LEVEL'},
        working: {name: 'WORKING'},
        ramp: {name: 'RAMP_TIME'}
      },
      'VIRTUAL_DIMMER': {
        level: {name: 'LEVEL'},
        working: {name: 'WORKING'},
        ramp: {name: 'RAMP_TIME'}
      },
      'DIMMER_VIRTUAL_RECEIVER': {
        level: {name: 'LEVEL'},
        working: {name: 'PROCESS'},
        ramp: {name: 'RAMP_TIME'}
      },
      'VIR-LG-WHITE-DIM-CH': {
        level: {name: 'LEVEL'},
        working: {name: 'PROCESS'},
        ramp: {name: 'RAMP_TIME'}
      },
      'VIR-LG-DIM-CH': {
        level: {name: 'LEVEL'},
        working: {name: 'PROCESS'},
        ramp: {name: 'RAMP_TIME'}
      }
    }
  }

  static configurationItems () {
    return {
      'useRampTime': {
        type: 'checkbox',
        default: false,
        label: 'Use Ramp Time',
        hint: 'uses a dimmer ramp time to slowly set the new level'
      },
      'rampTime': {
        type: 'number',
        default: 500,
        label: 'Ramp time in ms',
        hint: 'uses a dimmer ramp time to slowly set the new level'
      },
      'OnTime': {
        type: 'number',
        default: 0,
        label: 'On Time',
        hint: 'HAP will switch off this device automatically after the given seconds. Set this to 0 to turn off this feature.'
      }
    }
  }

  static channelTypes () {
    return ['DIMMER', 'VIRTUAL_DIMMER', 'DIMMER_VIRTUAL_RECEIVER', 'VIR-LG-WHITE-DIM-CH', 'VIR-LG-DIM-CH']
  }

  static serviceDescription () {
    return 'This service provides a dimmer in HomeKit'
  }
}

module.exports = HomeMaticDimmerAccessory

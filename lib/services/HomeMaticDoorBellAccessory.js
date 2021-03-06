/*
 * File: HomeMaticDoorBellAccessory.js
 * Project: hap-homematic
 * File Created: Sunday, 29th March 2020 1:35:00 pm
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

class HomeMaticDoorBellAccessory extends HomeMaticAccessory {
  publishServices (Service, Characteristic) {
    let service = this.addService(new Service.Doorbell(this._name))
    let self = this
    this.keyEvent = service.getCharacteristic(Characteristic.ProgrammableSwitchEvent)
    this.initialQuery = true

    this.registerAddressForEventProcessingAtAccessory(this.buildAddress('PRESS_SHORT'), (newValue) => {
      if (!self.initialQuery) {
        self.keyEvent.updateValue(0, null)
      }
      self.initialQuery = false
    })
  }

  static channelTypes () {
    return ['KEY', 'VIRTUAL_KEY']
  }

  static configurationItems () {
    return {}
  }

  static validate (configurationItem) {
    return false
  }

  static serviceDescription () {
    return 'This service provides a door bell in HomeKit, based on a KEY event at your CCU'
  }

  static getPriority () {
    return 1
  }
}

module.exports = HomeMaticDoorBellAccessory

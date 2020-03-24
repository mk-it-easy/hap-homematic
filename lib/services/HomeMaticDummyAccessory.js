// this is just a template
const path = require('path')
const HomeMaticAccessory = require(path.join(__dirname, 'HomeMaticAccessory.js'))

class HomeMaticDummyAccessory extends HomeMaticAccessory {
  publishServices (Service, Characteristic) {
    let self = this
    var leakSensor = this.getService(Service.X)
    this.state = leakSensor.getCharacteristic(Characteristic.X)
      .on('get', function (callback) {
        self.getValue('STATE', true).then((value) => {
          if (callback) callback(null, value)
        })
      })

    this.registerAddressForEventProcessingAtAccessory(this.buildAddress('STATE'), function (newValue) {
      self.state.updateValue(0, null)
    })
  }

  static channelTypes () {
    return ['DUMMY']
  }

  static configurationItems () {
    return {}
  }

  static validate (configurationItem) {
    return false
  }
}

module.exports = HomeMaticDummyAccessory
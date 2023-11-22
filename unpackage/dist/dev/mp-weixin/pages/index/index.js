"use strict";
const common_vendor = require("../../common/vendor.js");
const _sfc_main = {
  setup() {
    const count = common_vendor.ref(0);
    const content = common_vendor.ref("");
    const blueDeviceList = common_vendor.ref([]);
    function initBlue() {
      common_vendor.index.openBluetoothAdapter({
        success(res) {
          console.log("初始化蓝牙成功");
          console.log(res);
        },
        fail(err) {
          console.log("初始化蓝牙失败");
          console.error(err);
        }
      });
    }
    function discovery() {
      common_vendor.index.startBluetoothDevicesDiscovery({
        success(res) {
          console.log("开始搜索");
          common_vendor.index.onBluetoothDeviceFound(found);
        },
        fail(err) {
          console.log("搜索失败");
          console.error(err);
        }
      });
    }
    function found(res) {
      console.log(res);
      blueDeviceList.value.push(res.devices[0]);
    }
    const deviceId = common_vendor.ref("");
    const serviceId = common_vendor.ref("");
    function connect(data) {
      console.log(4, data);
      console.log(5, data.advertisServiceUUIDs[0]);
      deviceId.value = data.deviceId;
      serviceId.value = data.advertisServiceUUIDs[0];
      common_vendor.index.createBLEConnection({
        deviceId: deviceId.value,
        success(res) {
          console.log("连接成功");
          console.log(4, res);
          stopDiscovery();
          common_vendor.index.showToast({
            title: "连接成功"
          });
        },
        fail(err) {
          console.log("连接失败");
          console.error(err);
          common_vendor.index.showToast({
            title: "连接成功",
            icon: "error"
          });
        }
      });
    }
    function stopDiscovery() {
      common_vendor.index.stopBluetoothDevicesDiscovery({
        success(res) {
          console.log("停止成功");
          console.log(res);
        },
        fail(err) {
          console.log("停止失败");
          console.error(err);
        }
      });
    }
    function getServices() {
      common_vendor.index.getBLEDeviceServices({
        deviceId: deviceId.value,
        success(res) {
          console.log(6, res);
          common_vendor.index.showToast({
            title: "获取服务成功"
          });
        },
        fail(err) {
          console.error(err);
          common_vendor.index.showToast({
            title: "获取服务失败",
            icon: "error"
          });
        }
      });
    }
    const characteristicId = common_vendor.ref("");
    function getCharacteristics() {
      common_vendor.index.getBLEDeviceCharacteristics({
        deviceId: deviceId.value,
        serviceId: serviceId.value,
        success(res) {
          console.log(7, res);
          const newCharacteristics = res.characteristics.find((item) => {
            if (item.properties.read === true && item.properties.write === true && item.properties.notify === true) {
              return item;
            }
          });
          console.log(70, newCharacteristics);
          characteristicId.value = newCharacteristics.uuid;
          console.log(71, characteristicId.value);
          common_vendor.index.showToast({
            title: "获取特征值成功"
          });
        },
        fail(err) {
          console.error(err);
          common_vendor.index.showToast({
            title: "获取特征值失败",
            icon: "error"
          });
        }
      });
    }
    function notify() {
      common_vendor.index.notifyBLECharacteristicValueChange({
        deviceId: deviceId.value,
        // 设备id
        serviceId: serviceId.value,
        // 监听指定的服务
        characteristicId: characteristicId.value,
        // 监听对应的特征值
        state: true,
        //是否启用 notify
        success(res) {
          console.log("开启消息监听", res);
          listenValueChange();
          common_vendor.index.showToast({
            title: "已开启监听"
          });
        },
        fail(err) {
          console.error(8, err);
          common_vendor.index.showToast({
            title: "监听失败",
            icon: "error"
          });
        }
      });
    }
    function ab2hex(buffer) {
      const hexArr = Array.prototype.map.call(
        new Uint8Array(buffer),
        function(bit) {
          return ("00" + bit.toString(16)).slice(-2);
        }
      );
      return hexArr.join("");
    }
    function hexCharCodeToStr(hexCharCodeStr) {
      var trimedStr = hexCharCodeStr.trim();
      var rawStr = trimedStr.substr(0, 2).toLowerCase() === "0x" ? trimedStr.substr(2) : trimedStr;
      var len = rawStr.length;
      if (len % 2 !== 0) {
        alert("存在非法字符!");
        return "";
      }
      var curCharCode;
      var resultStr = [];
      for (var i = 0; i < len; i = i + 2) {
        curCharCode = parseInt(rawStr.substr(i, 2), 16);
        resultStr.push(String.fromCharCode(curCharCode));
      }
      return resultStr.join("");
    }
    const message = common_vendor.ref("");
    const messageHex = common_vendor.ref("");
    function listenValueChange() {
      common_vendor.index.onBLECharacteristicValueChange((res) => {
        console.log("监听结果", res);
        let resHex = ab2hex(res.value);
        console.log("resHex", resHex);
        messageHex.value = resHex;
        let result = hexCharCodeToStr(resHex);
        console.log("result", String(result));
        message.value = String(result);
      });
    }
    function send() {
      let data = strHexChar(content.value);
      console.log(13, data);
      var buf = new ArrayBuffer(data.length);
      var dataView = new DataView(buf);
      data.forEach(function(item, index) {
        dataView.setUint8(index, item);
      });
      console.log(13, buf);
      common_vendor.index.writeBLECharacteristicValue({
        deviceId: deviceId.value,
        serviceId: serviceId.value,
        characteristicId: characteristicId.value,
        value: buf,
        success(res) {
          console.log("发送写入数据", res);
          common_vendor.index.showToast({
            title: "write指令发送成功"
          });
        },
        fail(err) {
          console.error(err);
          common_vendor.index.showToast({
            title: "write指令发送失败",
            icon: "error"
          });
        }
      });
    }
    function send2() {
      var data = [136, 119, 102, 240, 68, 51, 34, 17];
      var buf = new ArrayBuffer(data.length);
      var dataView = new DataView(buf);
      data.forEach(function(item, index) {
        dataView.setUint8(index, item);
      });
      common_vendor.index.writeBLECharacteristicValue({
        deviceId: deviceId.value,
        serviceId: serviceId.value,
        characteristicId: characteristicId.value,
        value: buf,
        success(res) {
          console.log("发送写入数据", res);
          common_vendor.index.showToast({
            title: "write指令发送成功"
          });
        },
        fail(err) {
          console.error(err);
          common_vendor.index.showToast({
            title: "write指令发送失败",
            icon: "error"
          });
        }
      });
    }
    function read() {
      common_vendor.index.readBLECharacteristicValue({
        deviceId: deviceId.value,
        serviceId: serviceId.value,
        characteristicId: characteristicId.value,
        success(res) {
          console.log("读取数据", res);
          common_vendor.index.showToast({
            title: "read指令发送成功"
          });
        },
        fail(err) {
          console.error(err);
          common_vendor.index.showToast({
            title: "read指令发送失败",
            icon: "error"
          });
        }
      });
    }
    function strHexChar(str) {
      console.log("收到的str", str);
      let result = [];
      for (let i = 0; i < str.length; i += 2) {
        result.push(`0x${str.slice(i, i + 2)}`);
      }
      return result;
    }
    function inputBlur(e) {
      content.value = e.target.value;
      console.log(12, content.value);
    }
    return {
      count,
      initBlue,
      discovery,
      getServices,
      getCharacteristics,
      notify,
      send,
      send2,
      read,
      blueDeviceList,
      connect,
      content,
      inputBlur
    };
  },
  mounted() {
    console.log(this.count);
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: common_vendor.f($setup.blueDeviceList, (item, k0, i0) => {
      return {
        a: common_vendor.t(item.deviceId),
        b: common_vendor.t(item.name),
        c: common_vendor.o(($event) => $setup.connect(item))
      };
    }),
    b: common_vendor.o((...args) => $setup.inputBlur && $setup.inputBlur(...args)),
    c: common_vendor.o((...args) => $setup.initBlue && $setup.initBlue(...args)),
    d: common_vendor.o((...args) => $setup.discovery && $setup.discovery(...args)),
    e: common_vendor.o((...args) => $setup.getServices && $setup.getServices(...args)),
    f: common_vendor.o((...args) => $setup.getCharacteristics && $setup.getCharacteristics(...args)),
    g: common_vendor.o((...args) => $setup.notify && $setup.notify(...args)),
    h: common_vendor.o((...args) => $setup.send && $setup.send(...args)),
    i: common_vendor.o((...args) => $setup.read && $setup.read(...args))
  };
}
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__file", "/Users/liqian/Desktop/同步空间/demo1/uni-app-bluetooth/pages/index/index.vue"]]);
wx.createPage(MiniProgramPage);

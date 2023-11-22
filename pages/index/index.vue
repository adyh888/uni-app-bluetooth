<template>
  <view>
    <scroll-view
        scroll-y
        class="box"
    >
      <view class="item" v-for="item in blueDeviceList" @click="connect(item)">
        <view>
          <text>id: {{ item.deviceId }}</text>
        </view>
        <view>
          <text>name: {{ item.name }}</text>
        </view>
      </view>
    </scroll-view>
    <input type="text" placeholder="请输入指令报文" @blur="inputBlur"/>
    <button @click="initBlue">1 初始化蓝牙</button>

    <button @click="discovery">2 搜索附近蓝牙设备</button>

    <button @click="getServices">3 获取蓝牙服务</button>

    <button @click="getCharacteristics">4 获取特征值</button>

    <button @click="notify">5 开启消息监听</button>

    <button @click="send">6 发送数据</button>

    <!--    <button @click="send2">10 发送数据-锁的状态</button>-->

    <button @click="read">7 读取数据</button>

<!--    <view class="msg_x">-->
<!--      <view class="msg_txt">-->
<!--        监听到的内容：{{ message }}-->
<!--      </view>-->
<!--      <view class="msg_hex">-->
<!--        监听到的内容（十六进制）：{{ messageHex }}-->
<!--      </view>-->
<!--    </view>-->
  </view>
</template>

<script>
import { ref } from 'vue'
export default {
  setup() {
    const count = ref(0)
    const content = ref('')
    // 搜索到的蓝牙设备列表
    const blueDeviceList = ref([])

// 【1】初始化蓝牙
    function initBlue() {
      uni.openBluetoothAdapter({
        success(res) {
          console.log('初始化蓝牙成功')
          console.log(res)
        },
        fail(err) {
          console.log('初始化蓝牙失败')
          console.error(err)
        }
      })
    }

// 【2】开始搜寻附近设备
    function discovery() {
      uni.startBluetoothDevicesDiscovery({
        success(res) {
          console.log('开始搜索')
          // 开启监听回调
          uni.onBluetoothDeviceFound(found)
        },
        fail(err) {
          console.log('搜索失败')
          console.error(err)
        }
      })
    }

// 【3】找到新设备就触发该方法
    function found(res) {
      console.log(res)
      blueDeviceList.value.push(res.devices[0])
    }

    // 蓝牙设备的id
    const deviceId = ref('')
    // 硬件提供的服务id，开发中需要问硬件佬获取该id
    const serviceId = ref('')
// 【4】连接设备
    function connect(data) {
      console.log(4,data)
      console.log(5,data.advertisServiceUUIDs[0])
      deviceId.value = data.deviceId // 将获取到的设备ID存起来
      serviceId.value = data.advertisServiceUUIDs[0] // 硬件服务的id
      uni.createBLEConnection({
        deviceId: deviceId.value,
        success(res) {
          console.log('连接成功')
          console.log(4,res)
          // 停止搜索
          stopDiscovery()
          uni.showToast({
            title: '连接成功'
          })
        },
        fail(err) {
          console.log('连接失败')
          console.error(err)
          uni.showToast({
            title: '连接成功',
            icon: 'error'
          })
        }
      })
    }

// 【5】停止搜索
    function stopDiscovery() {
      uni.stopBluetoothDevicesDiscovery({
        success(res) {
          console.log('停止成功')
          console.log(res)
        },
        fail(err) {
          console.log('停止失败')
          console.error(err)
        }
      })
    }



// 【6】获取服务
    function getServices() {
      // 如果是自动链接的话，uni.getBLEDeviceServices方法建议使用setTimeout延迟1秒后再执行
      uni.getBLEDeviceServices({
        deviceId: deviceId.value,
        success(res) {
          console.log(6,res) // 可以在res里判断有没有硬件佬给你的服务
          // serviceId.value = '0000FFE0-0000-1000-8000-00805F9B34FB'
          // serviceId.value = '0000FFE0-0000-1000-8000-00805F9B34FB'
          uni.showToast({
            title: '获取服务成功'
          })
        },
        fail(err) {
          console.error(err)
          uni.showToast({
            title: '获取服务失败',
            icon: 'error'
          })
        }
      })
    }

    //该服务的特征值（筛选可读，可写）
    const characteristicId = ref('')

// 【7】获取特征值
    function getCharacteristics() {
      // 如果是自动链接的话，uni.getBLEDeviceCharacteristics方法建议使用setTimeout延迟1秒后再执行
      uni.getBLEDeviceCharacteristics({
        deviceId: deviceId.value,
        serviceId: serviceId.value,
        success(res) {
          console.log(7,res) // 可以在此判断特征值是否支持读写等操作，特征值其实也需要提前向硬件佬索取的
          const newCharacteristics =  res.characteristics.find(item=>{
            if(item.properties.read === true && item.properties.write === true && item.properties.notify === true){
              return item
            }
          })
          console.log(70,newCharacteristics)
          characteristicId.value= newCharacteristics.uuid
          console.log(71,characteristicId.value)
          uni.showToast({
            title: '获取特征值成功'
          })
        },
        fail(err) {
          console.error(err)
          uni.showToast({
            title: '获取特征值失败',
            icon: 'error'
          })
        }
      })
    }



// 【8】开启消息监听
    function notify() {
      uni.notifyBLECharacteristicValueChange({
        deviceId:deviceId.value, // 设备id
        serviceId:serviceId.value, // 监听指定的服务
        characteristicId:characteristicId.value, // 监听对应的特征值
        state:true,//是否启用 notify
        success(res) {
          console.log('开启消息监听',res)
          listenValueChange()
          uni.showToast({
            title: '已开启监听'
          })
        },
        fail(err) {
          console.error(8,err)
          uni.showToast({
            title: '监听失败',
            icon: 'error'
          })
        }
      })
    }

// ArrayBuffer转16进度字符串示例
    function ab2hex(buffer) {
      const hexArr = Array.prototype.map.call(
          new Uint8Array(buffer),
          function (bit) {
            return ('00' + bit.toString(16)).slice(-2)
          }
      )
      return hexArr.join('')
    }

// 将16进制的内容转成我们看得懂的字符串内容
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

// 监听到的内容
    const message = ref('')
    const messageHex = ref('') // 十六进制

// 【9】监听消息变化
    function listenValueChange() {
      uni.onBLECharacteristicValueChange(res => {
        console.log('监听结果',res)
        // 结果里有个value值，该值为 ArrayBuffer 类型，所以在控制台无法用肉眼观察到，必须将该值转换为16进制
        let resHex = ab2hex(res.value)
        console.log('resHex',resHex)
        messageHex.value = resHex
        // 最后将16进制转换为ascii码，就能看到对应的结果
        let result = hexCharCodeToStr(resHex)
        console.log('result',String(result))
        message.value = String(result)
      })
    }

	//16进制转2进制
	function hexToBinary2(hex){
	var hexString = parseInt(hex, 16).toString(2);
	var binaryString = ("00000000" + hexString).substr(-8);
	return binaryString;
	}

// 【10】发送数据
    function send() {
      // 向蓝牙设备发送一个0x00的16进制数据
      // let msg = 'hello'
      // const data =  Buffer.from(content.value)
      // console.log(18,data)
      // console.log(19,data.toString())
      //对字节数据做一些处理
      // const sendPackage =  subPackage(content.value)
      // console.log('sendPackage',sendPackage)
      // let i = 0;
      // let len = sendPackage.length;
      // if (len && len > i) {
      //   const buffer = string2buf(sendPackage[i])
      //   console.log('buffer',buffer)
      // }

      // const buffer = new ArrayBuffer(content.value.length)
      // console.log(18,buffer)
      // const dataView = new DataView(buffer)
      // for (var i = 0; i < content.value.length; i++) {
      //   dataView.setUint8(i, content.value.charAt(i).charCodeAt())
      // }
      // console.log(19,dataView)
      //16进制的数据发送
      // var data = [0x88, 0x77, 0x66, 0xff, 0x44, 0x33, 0x22, 0x11 ];
      let data = strHexChar(content.value)
      console.log(13,data)
      var buf = new ArrayBuffer(data.length);
      var dataView = new DataView(buf);
      data.forEach(function (item, index) {
        dataView.setUint8(index, item);
      });
      console.log(13,buf)
      uni.writeBLECharacteristicValue({
        deviceId: deviceId.value,
        serviceId: serviceId.value,
        characteristicId: characteristicId.value,
        value:buf,
        success(res) {
          console.log('发送写入数据', res)
          uni.showToast({
            title: 'write指令发送成功'
          })
        },
        fail(err) {
          console.error(err)
          uni.showToast({
            title: 'write指令发送失败',
            icon: 'error'
          })
        }
      })


    }

    //监听锁的状态
    function send2() {
      //16进制的数据发送
      var data = [0x88, 0x77, 0x66, 0xf0, 0x44, 0x33, 0x22, 0x11 ];
      var buf = new ArrayBuffer(data.length);
      var dataView = new DataView(buf);
      data.forEach(function (item, index) {
        dataView.setUint8(index, item);
      });
      uni.writeBLECharacteristicValue({
        deviceId: deviceId.value,
        serviceId: serviceId.value,
        characteristicId: characteristicId.value,
        value:buf,
        success(res) {
          console.log('发送写入数据', res)
          uni.showToast({
            title: 'write指令发送成功'
          })
        },
        fail(err) {
          console.error(err)
          uni.showToast({
            title: 'write指令发送失败',
            icon: 'error'
          })
        }
      })


    }

// 【11】读取数据
    function read() {
      uni.readBLECharacteristicValue({
        deviceId: deviceId.value,
        serviceId: serviceId.value,
        characteristicId: characteristicId.value,
        success(res) {
          console.log('读取数据',res)
          uni.showToast({
            title: 'read指令发送成功'
          })
        },
        fail(err) {
          console.error(err)
          uni.showToast({
            title: 'read指令发送失败',
            icon: 'error'
          })
        }
      })
    }


    /**
     * 字符串每20个字节分包返回数组
     */
    function subPackage(str) {
      const packageArray = []
      for (let i = 0; str.length > i; i += 20) {
        packageArray.push(str.substr(i, 20))
      }
      return packageArray
    }
    function string2buf(str) {

      // 首先将字符串转为16进制
      let val = ""
      for (let i = 0; i < str.length; i++) {
        if (val === '') {
          val = str.charCodeAt(i).toString(16)
        } else {
          val += ',' + str.charCodeAt(i).toString(16)
        }
      }
      // 将16进制转化为ArrayBuffer
      return new Uint8Array(val.match(/[\da-f]{2}/gi).map(function (h) {
        return parseInt(h, 16)
      })).buffer
    }

    //将字符串处理为16进制的数组
    function strHexChar (str){
      console.log('收到的str',str)
      let result = []
      for (let i = 0; i < str.length; i += 2) {
        result.push(`0x${str.slice(i, i + 2)}`)
      }
      return result
    }

    //获取input输入的值
    // function onKeyInput(event) {
    //   console.log(10,event)
    //   content.value = event.detail.value
    //   console.log(11,content.value)
    // }

    function  inputBlur(e){
      content.value = e.target.value
      console.log(12,content.value)
    }

    // 返回值会暴露给模板和其他的选项式 API 钩子
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
    }
  },

  mounted() {
    console.log(this.count) // 0
  }
}


</script>

<style>
.box {
  width: 100%;
  height: 400rpx;
  box-sizing: border-box;
  margin-bottom: 20rpx;
  border: 2px solid dodgerblue;
}
.item {
  box-sizing: border-box;
  padding: 10rpx;
  border-bottom: 1px solid #ccc;
}
button {
  margin-bottom: 20rpx;
}
</style>

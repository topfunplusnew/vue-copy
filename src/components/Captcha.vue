<template>
    <div class="drag" ref="dragDiv">
      <div class="drag_bg"></div>
      <div class="drag_text">{{ confirmWords }}</div>
      <div
        ref="moveDiv"
        @mousedown="mousedownFn($event)"
        :class="{'handler_ok_bg': confirmSuccess}"
        class="handler handler_bg"
        style="position: absolute; top: 0px; left: 0px;"
      ></div>
    </div>
  </template>
  
  <script>
  export default {
    data() {
      return {
        beginClientX: 10, // 距离屏幕左端的距离
        mouseMoveStata: false, // 触发拖动状态
        maxwidth: '', // 拖动最大宽度
        confirmWords: 'Drag the slider to verify', // 滑块显示的文字
        confirmSuccess: false, // 验证成功的状态
      };
    },
    methods: {
      mousedownFn(e) {
        if (!this.confirmSuccess) {
          e.preventDefault(); // 阻止默认事件
          this.mouseMoveStata = true;
          this.beginClientX = e.clientX;
        }
      },
      successFunction() {
        this.confirmSuccess = true;
        this.confirmWords = 'Verification passed';
        // 移除事件监听器，避免验证成功后继续监听
        if (window.addEventListener) {
          document.getElementsByTagName('html')[0].removeEventListener('mousemove', this.mouseMoveFn);
          document.getElementsByTagName('html')[0].removeEventListener('mouseup', this.moseUpFn);
        } else {
          document.getElementsByTagName('html')[0].removeEventListener('mouseup', () => {});
        }
        document.getElementsByClassName('drag_text')[0].style.color = '#fff';
        document.getElementsByClassName('handler')[0].style.left = this.maxwidth + 'px';
        document.getElementsByClassName('drag_bg')[0].style.width = this.maxwidth + 'px';
        this.$emit('success'); // 触发父组件的 success 事件
      },
      mouseMoveFn(e) {
        if (this.mouseMoveStata) {
          const width = e.clientX - this.beginClientX;
          if (width > 0 && width <= this.maxwidth) {
            document.getElementsByClassName('handler')[0].style.left = width + 'px';
            document.getElementsByClassName('drag_bg')[0].style.width = width + 'px';
          } else if (width > this.maxwidth) {
            this.successFunction();
          }
        }
      },
      moseUpFn(e) {
        this.mouseMoveStata = false;
        const width = e.clientX - this.beginClientX;
        if (width < this.maxwidth) {
          document.getElementsByClassName('handler')[0].style.left = 0 + 'px';
          document.getElementsByClassName('drag_bg')[0].style.width = 0 + 'px';
        }
      },
    },
    mounted() {
      this.maxwidth = this.$refs.dragDiv.clientWidth - this.$refs.moveDiv.clientWidth;
      document.getElementsByTagName('html')[0].addEventListener('mousemove', this.mouseMoveFn);
      document.getElementsByTagName('html')[0].addEventListener('mouseup', this.moseUpFn);
    },
  };
  </script>
  
  <style scoped>
  .drag {
    position: relative;
    background-color:rgba(136, 110, 110, 0.2); /* 透明度 0.5 */;
    width: 400px;
    height: 45px;
    line-height: 45px;
    text-align: center;
    margin: 30px auto; /* 调整与上下组件的距离 */
    margin-left: 2.2rem;
  }

  .handler {
    width: 40px;
    height: 45px;
    border: 1px solid #ccc;
    cursor: move;
  }
  .handler_bg {
    background: #fff;
  }
  .handler_ok_bg {
    background: #fff;
  }
  .drag_bg {
    background-color: #808080;
    height: 45px;
    width: 0px;
  }
  .drag_text {
    position: absolute;
    top: 0px;
    width: 100%;
    text-align: center;
    user-select: none;
  }
  </style>
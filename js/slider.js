const WholePageSlider = class {
  constructor (options = {}) {
    this.container = options.containerId ? document.getElementById(options.containerId) : document.body
    this.sections = options.sectionClass ? document.getElementsByClassName(options.sectionClass) : document.getElementsByTagName('section')
    this.pageClass = options.pageClass ? options.pageClass : 'page'

    this.pagesPerSection = []
    this.currentPage = []
    this.currentSection = 0

    this.isDragging = false
    this.draggingPercent = 20

    this.waitAnimation = false
    this.timeToAnimate = 500
    
    this.height = 100
    this.width = 100

    this.swipeStartDirection = null
    this.swipeEndDirection = null
    
    this.options = {
      ...options
    }
    this.translate = {
      section: 0,
      page: []
    }
    
    this.touches = {
      startX: null,
      startY: null,
      endX: null,
      endY: null,
      differenceX: null,
      differenceY: null
    }
    
    this.init()
    this.setupEventListeners()

  }

  init () {

    const sectionButtonContainer = this.createElement('div', { className: 'sectionButtonContainer' }, this.container)

    // 为每个部分创建元素并应用样式
    for (let index = 0; index < this.sections.length; index++) {

      // 计算并添加每个节的起始页位置
      this.translate.page[index] = 0
      this.currentPage[index] = 0
      this.pagesPerSection[index] = this.sections[index].getElementsByClassName(this.pageClass)
      
      // 为每个节添加背景颜色
      if (this.options.colors) {
        this.sections[index].style.background = this.options.colors[index] ? this.options.colors[index] : 'white'
      }
      
      // 确保在创建导航之前有超过1个页面
      if (this.sections.length > 1) {

        // 为每个部分创建单选按钮
        const sectionNavigationButton = this.createElement('input', {
          type: 'radio',
          name: 'sectionScrollButton',
          id: `sectionId[${index}]`,
          value: index,
          onclick: function (event) {

            if (this.waitAnimation) {
              return event.preventDefault()
            } else {
              this.switchAndTranslateSection(event) 
            }

          }.bind(this),
          checked: this.currentSection === index,
          style: {
            display: 'none'
          }
        }, sectionButtonContainer)

        // 为按钮添加自定义样式
        this.createElement('label', { htmlFor: sectionNavigationButton.id }, sectionButtonContainer)
        
      }

      // 仅当有多个页面时才为页面创建导航
      if (this.pagesPerSection[index].length > 1) {
        
        const pageButtonContainer = this.createElement('div', { id: `pageButtonContainer[${index}]`, className: 'page_selection' }, this.sections[index])

        for (let i = 0; i < this.pagesPerSection[index].length; i++) {

          // 为每个界面创建单选按钮
          this.createElement('input', {
            type: 'radio',
            id: `page[${index}][${i}]`,
            name: `pagination[${index}]`,
            value: i,
            checked: this.currentPage[i] === i,
            onclick: function (event) {

              if (this.waitAnimation) {
                return event.preventDefault()
              } else {
                this.switchAndTranslatePage(event) 
              }
            
            }.bind(this),
            style: {
              display: 'none'
            }
          }, pageButtonContainer)

          // 为按钮添加自定义样式
          this.createElement('label', { htmlFor: `page[${index}][${i}]` }, pageButtonContainer)

        }
        // 中心对齐添加按钮后的界面
        pageButtonContainer.style.left = `calc(50% - ${pageButtonContainer.getBoundingClientRect().width / 2}px)`
      }
    }
    // 同上 中心对齐
    sectionButtonContainer.style.top = `calc(50% - ${sectionButtonContainer.getBoundingClientRect().height / 2}px)`
  }

  switchAndTranslateSection (swipeOrClick) {
    // 如果我们没有创建节或必须等待动画完成后返回
    if (!this.sections || this.sections.length < 1 || this.waitAnimation) {
      return
    } else {
      this.waitAnimation = true
    }

    // （上下）滑动或点击控制
    if (((swipeOrClick.deltaY > 0 || swipeOrClick === 'down') && this.swipeStartDirection !== 'up') && (this.currentSection < this.sections.length - 1)) {
      this.currentSection++
      this.translate.section -= this.height
    } else
    if (((swipeOrClick.deltaY < 0 || swipeOrClick === 'up') && this.swipeStartDirection !== 'down') && (this.currentSection > 0)) {
      this.currentSection--
      this.translate.section += this.height
    } else  
    if (swipeOrClick.type === 'click') {
      const click = parseInt(swipeOrClick.target.value) - this.currentSection
      this.currentSection = parseInt(swipeOrClick.target.value)
      this.translate.section = this.translate.section - (this.height * click)
    } else {
      // 现在，如果有任何拖动，取消动画回到原点.
      this.translate.section = Math.round(this.translate.section / 100) * 100
    }

    // 在导航按钮上显示活动页
    const button = document.getElementById(`sectionId[${this.currentSection}]`)
    if (button) {
      button.checked = true
    }
   
    // 重置设置
    this.isDragging = false
    this.height = 100
    
    // 动画部分
    for (let index = 0; index < this.sections.length; index++) {
      this.sections[index].style.transform = `translateY(${this.translate.section}%)`
    }

    // 调用下一个动画前完成上一个动画
    setTimeout(() => {
      this.waitAnimation = false
    }, this.timeToAnimate)
  }

  switchAndTranslatePage (swipeOrClick) {

    if (!this.sections || this.sections.length < 1 || this.waitAnimation) {
      return
    } 

    // （左右）滑动界面或点击
    if (swipeOrClick === 'right' && this.swipeStartDirection !== 'left' && (this.currentPage[this.currentSection] < this.pagesPerSection[this.currentSection].length - 1)) {
      this.currentPage[this.currentSection]++
      this.translate.page[this.currentSection] -= this.width
    } else
    if (swipeOrClick === 'left' && this.swipeStartDirection !== 'right' && (this.currentPage[this.currentSection] > 0)) {
      this.currentPage[this.currentSection]--
      this.translate.page[this.currentSection] += this.width
    } else
    if (swipeOrClick.type === 'click') {
      const getDirectionFromClick = parseInt(swipeOrClick.target.value) - this.currentPage[this.currentSection]
      this.currentPage[this.currentSection] = parseInt(swipeOrClick.target.value)
      this.translate.page[this.currentSection] = this.translate.page[this.currentSection] - (this.width * getDirectionFromClick)
    } else {
      // 现在，如果有任何拖动，取消-动画回到原点
      this.translate.page[this.currentSection] = Math.round(this.translate.page[this.currentSection] / 100) * 100
    }

    // 重置设置
    this.isDragging = false
    this.width = 100
    
    // 在导航按钮上显示活动页
    const button = document.getElementById(`page[${this.currentSection}][${this.currentPage[this.currentSection]}]`)
    if (button) {
      button.checked = true
    }
    
    // 动画
    for (let index = 0; index < this.pagesPerSection[this.currentSection].length; index++) {
      this.pagesPerSection[this.currentSection][index].style.transform = `translateX(${this.translate.page[this.currentSection]}%)`
    }

    // 调用下一个动画前完成上一个
    setTimeout(() => {
      this.waitAnimation = false
    }, this.timeToAnimate)
  }

  draggingEffect () {
    
    if (!this.isDragging) {
      return
    }

    // 保存开始滑动方向，以便在触摸/单击结束时进行比较
    this.swipeStartDirection = this.swipeEndDirection
    //（左右）
    // 检查是否水平拖动，并且没有等待任何以前的动画完成
    if ((this.swipeStartDirection === 'left' || this.swipeStartDirection === 'right') && !this.waitAnimation) {

      // 获取当前节的所有页面
      const pages = this.pagesPerSection[this.currentSection]

      // 拖动效果
      if (this.swipeStartDirection === 'right') {
        this.width -= this.draggingPercent
        this.translate.page[this.currentSection] -= this.draggingPercent
      } else
      if (this.swipeStartDirection === 'left') {
        this.width -= this.draggingPercent
        this.translate.page[this.currentSection] += this.draggingPercent
      }

      // 设置水平拖动效果的动画
      for (let index = 0; index < pages.length; index++) {
        pages[index].style.transform = `translateX(${this.translate.page[this.currentSection]}%)`
      }
    }
    //（上下）
    // 检查是否水平拖动，并且没有等待任何以前的动画完成
    if ((this.swipeStartDirection === 'up' || this.swipeStartDirection === 'down') && !this.waitAnimation) {
     
      // 拖动效果
      if (this.swipeStartDirection === 'down') {
        this.height -= this.draggingPercent
        this.translate.section -= this.draggingPercent
      } else
      if (this.swipeStartDirection === 'up') {
        this.height -= this.draggingPercent
        this.translate.section += this.draggingPercent
      }

      // 设置垂直拖动的动画
      for (let index = 0; index < this.sections.length; index++) {
        this.sections[index].style.transform = `translateY(${this.translate.section}%)`
      }
    }

    // 拖动完成便不再拖动
    this.isDragging = false
  }

  // 检查是电脑设备还是手机设备
  getTouchOrClick (event) {
    const touch = event.touches ? event.touches[0] : event
    return touch
  }

  touchStart (event) {
    this.isDragging = true 
    this.touches.startX = this.getTouchOrClick(event).clientX
    this.touches.startY = this.getTouchOrClick(event).clientY
  }

  touchMove (event) {
    if (!this.touches.startX || !this.touches.startY) { 
      return
    }

    this.touches.endX = this.getTouchOrClick(event).clientX
    this.touches.endY = this.getTouchOrClick(event).clientY

    this.touches.differenceX = this.touches.startX - this.touches.endX
    this.touches.differenceY = this.touches.startY - this.touches.endY

    //是否是竖直或水平滑动，然后左右或上下
    if (Math.abs(this.touches.differenceX) > Math.abs(this.touches.differenceY)) {
      this.swipeEndDirection = this.touches.differenceX > 0 ? 'right' : 'left'
    } else {
      this.swipeEndDirection = this.touches.differenceY > 0 ? 'down' : 'up'
    }

    this.draggingEffect()
  }

  touchEnd () {
    if (this.swipeEndDirection) {   
      this.switchAndTranslatePage(this.swipeEndDirection)
      this.switchAndTranslateSection(this.swipeEndDirection)
    }

    this.isDragging = false
    this.touches.startX = null
    this.touches.startY = null
    this.swipeStartDirection = null
    this.swipeEndDirection = null
  }

  swipeWithKeyboard (event) {

    if (event.keyCode === 37 || event.code === 'ArrowLeft') {
      this.swipeEndDirection = 'left'
    } else
       
    if (event.keyCode === 38 || event.code === 'ArrowUp') {
      this.swipeEndDirection = 'up'
    } else

    if (event.keyCode === 39 || event.code === 'ArrowRight') {
      this.swipeEndDirection = 'right'
    } else 

    if (event.keyCode === 40 || event.code === 'ArrowDown') {
      this.swipeEndDirection = 'down'
    }

    // 检查是否只按下任何允许的按键，后执行功能
    if (this.swipeEndDirection && !this.waitAnimation) {
      this.switchAndTranslatePage(this.swipeEndDirection)
      this.switchAndTranslateSection(this.swipeEndDirection)
    }

  }
  
  createElement (tag, options, parent) {
    try {
      const getParent = (typeof parent) === 'object' ? parent : document.getElementById(parent)
      const createElement = document.createElement(tag)
      
      for (const key in options) {

        if (key === 'style') {

          for (const style in options[key]) {
            createElement.style[style] = options[key][style]
          }

        } else if (key === 'onclick') {
         
          createElement.addEventListener('click', options[key])
          
        } else {
          createElement[key] = options[key]
        }

      }
      
      getParent.appendChild(createElement)
      return createElement
      
    } catch (error) {
      this.handleError('Unable to create buttons', error)
    }
  }

  setupEventListeners () {
    window.onwheel = this.switchAndTranslateSection.bind(this)
    window.onmousedown = this.touchStart.bind(this)
    window.onmousemove = this.touchMove.bind(this)
    window.onmouseup = this.touchEnd.bind(this)
    window.ontouchstart = this.touchStart.bind(this)
    window.ontouchmove = this.touchMove.bind(this)
    window.ontouchend = this.touchEnd.bind(this)
    window.onkeyup = this.swipeWithKeyboard.bind(this)
  }

  handleError (string, error) {
    console.warn(`${string}: `, error)
  }
}

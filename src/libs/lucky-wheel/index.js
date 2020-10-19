import Global from 'src/mixin'

export default class RouletteWheel extends Global {
  constructor(el, options) {
    super();

    this.canvas = document.querySelector(el); // canvas 对象
    this.ctx = this.canvas.getContext('2d');  // 2d 上下文

    this.centerX = this.canvas.width / 2;
    this.centerY = this.canvas.height / 2;
    this.outsideRadius = options.outsideRadius || this.centerX - 50; // 转盘半径

    this.evenColor = options.evenColor     || '#FF6766';
    this.oddColor = options.oddColor       || '#FD5757';
    this.loseColor = options.loseColor     || '#F79494'
    this.textColor = options.textColor     || 'White';

    this.arrowColorFrom = options.arrowColorFrom   || '#FFFC95';
    this.arrowColorTo = options.arrowColorTo       || '#FF9D37';
    this.buttonFont = options.buttonFont           || 'START';
    this.buttonFontColor = options.buttonFontColor || '#88411F';
    this.buttonColorFrom = options.buttonColorFrom || '#FDC964';
    this.buttonColorTo = options.buttonColorTo     || '#FFCB65';

    this.awards = options.awards; // 奖品列表
    this.startRadian = options.startRadian || 0; // 开始弧度
    this.duration = options.duration || 5000;    // 旋转持续时间
    this.finish = options.finish; // 抽奖动画结束后回调函数
    this.fetchAward = options.fetchAward; // 自定义获取奖品
    this.animation; // 自定义缓动函数

    this.INSIDE_RADIUS = 0;
    this.TEXT_RADIAS = this.outsideRadius * .8;
    this.FONT_STYLE = `bold ${this.outsideRadius * .07}px Helvetica, Arial`;

    this.ARROW_RADIUS = this.outsideRadius / 3;     // 圆盘指针的半径
    this.BUTTON_RADIUS = this.ARROW_RADIUS * .8;     // 圆盘内部按钮的半径

    this.AWARDS_COUNT = this.awards.length;
    this.AWARD_RADIAN = (Math.PI * 2) / this.AWARDS_COUNT;

    // 私有变量集
    this._isAnimate = false;   // 是否动画中
    this._spinningTime = 0;    // 当前动画位置
    this._spinTotalTime = 0;   // 动画所需时间
    this._spinningChange = 0;  // 动画峰值
    this._canvasStyle;
    this._awardedIndex = 0; // 当前获奖索引
  };

  /**
   * 绘制转盘
   */
  drawLuckyWheel() {
    const context = this.ctx;

    context.clearRect(0, 0, context.canvas.width, context.canvas.height);

    // ---------- 绘制外表盘
    context.save();
    let rgb = this.oddColor.replace('#', ''),
        r = parseInt(rgb[0] + rgb[1], 16),
        g = parseInt(rgb[2] + rgb[3], 16),
        b = parseInt(rgb[4] + rgb[5], 16);
        
    context.fillStyle = `rgba(${r}, ${g}, ${b}, .72)`;
    context.shadowColor = 'rgba(0, 0, 0, .24)';
    context.shadowOffsetX = 0;
    context.shadowOffsetY = 5;
    context.shadowBlur = 15;
    context.arc(this.centerX, this.centerY, this.outsideRadius, 0, Math.PI * 2, false);
    context.fill();
    context.restore();
    // ----------

    // --------- 绘制表盘中的色块，和对应的文字与图片
    for (let i = 0; i < this.AWARDS_COUNT; i ++) {
        // 绘制色块
        context.save();

        if (this.awards[i].type === 'losing') context.fillStyle = this.loseColor;
        else if (i % 2 === 0) context.fillStyle = this.evenColor;
        else                  context.fillStyle = this.oddColor;

        let _startRadian = this.startRadian + this.AWARD_RADIAN * i,
            _endRadian =   _startRadian + this.AWARD_RADIAN;

        context.beginPath();
        context.arc(this.centerX, this.centerY, this.outsideRadius - 5, _startRadian, _endRadian, false);
        context.arc(this.centerX, this.centerY, this.INSIDE_RADIUS, _endRadian, _startRadian, true);
        context.fill();
        context.restore();

        // 绘制图片
        if (this.awards[i].type === 'image') {
            let self = this,                    
                image = new Image();
                image.src = this.awards[i].content;

            function drawImage(self, context) {
                let size = Math.sin(self.AWARD_RADIAN) * self.outsideRadius / 2.5;
                context.save();
                context.translate(
                    self.centerX + Math.cos(_startRadian + self.AWARD_RADIAN / 2) * self.TEXT_RADIAS,
                    self.centerY + Math.sin(_startRadian + self.AWARD_RADIAN / 2) * self.TEXT_RADIAS
                )
                context.rotate(_startRadian + self.AWARD_RADIAN / 2 + Math.PI / 2);
                context.drawImage(
                    image, 
                    - size / 2, 0,
                    size, size
                );
                context.restore();
            }

            // 如果图片未加载，则加载
            // 如果图片已经加载完成，则直接使用
            if (!image.complete) {
                image.onload = function (e) {
                    drawImage(self, context);
                }
            } else {
                drawImage(self, context);
            }

        } 
        // 绘制文字
        else if (this.awards[i].type === 'text' || this.awards[i].type === 'losing') {
            let award = this.awards[i].content;
            context.save();
            context.fillStyle = this.textColor;
            context.font = this.FONT_STYLE;
            context.translate(
                this.centerX + Math.cos(_startRadian + this.AWARD_RADIAN / 2) * this.TEXT_RADIAS,
                this.centerY + Math.sin(_startRadian + this.AWARD_RADIAN / 2) * this.TEXT_RADIAS
            );
            context.rotate(_startRadian + this.AWARD_RADIAN / 2 + Math.PI / 2);
            context.fillText(award, -context.measureText(award).width / 2, 0);
            context.restore();
        }
    }
    // ----------

    // ---------- 绘制按钮指针
    let moveX = this.centerX,
        moveY = this.centerY - this.ARROW_RADIUS + 5;

    context.save();
    context.fillStyle = this.arrowColorFrom;
    context.beginPath();
    context.moveTo(moveX, moveY);
    context.lineTo(moveX - 15, moveY);
    context.lineTo(moveX, moveY - 30);
    context.closePath();
    context.fill();
    context.restore();

    context.save();
    context.fillStyle = this.arrowColorTo;
    context.beginPath();
    context.moveTo(moveX, moveY);
    context.lineTo(moveX + 15, moveY);
    context.lineTo(moveX, moveY - 30);
    context.closePath();
    context.fill();
    context.restore();
    // ----------


    // ---------- 绘制按钮圆盘
    let gradient_1 = context.createLinearGradient(
        this.centerX - this.ARROW_RADIUS, this.centerY - this.ARROW_RADIUS,
        this.centerX - this.ARROW_RADIUS, this.centerY + this.ARROW_RADIUS
    );
    context.save();
    gradient_1.addColorStop(0, this.arrowColorFrom);
    gradient_1.addColorStop(1, this.arrowColorTo);
    context.fillStyle = gradient_1;

    context.shadowColor = 'rgba(0, 0, 0, .12)';
    context.shadowOffsetX = 0;
    context.shadowOffsetY = 5;
    context.shadowBlur = 15;

    context.beginPath();
    context.arc(this.centerX, this.centerY, this.ARROW_RADIUS, 0, Math.PI * 2, false);
    context.fill();
    context.restore();
    // ---------- 

    // ---------- 绘制按钮
    let gradient_2 = context.createLinearGradient(
        this.centerX - this.BUTTON_RADIUS, this.centerY - this.BUTTON_RADIUS,
        this.centerX - this.BUTTON_RADIUS, this.centerY + this.BUTTON_RADIUS
    );
    context.save();
    gradient_2.addColorStop(0, this.buttonColorFrom);
    gradient_2.addColorStop(1, this.buttonColorTo);
    context.fillStyle = gradient_2;
    context.beginPath();
    context.arc(this.centerX, this.centerY, this.BUTTON_RADIUS, 0, Math.PI * 2, false);
    context.fill();
    context.restore();
    // ----------

    // ---------- 绘制按钮文字
    context.save();
    context.fillStyle = this.buttonFontColor;
    context.font = `bold ${this.BUTTON_RADIUS / 2}px helvetica`;
    super.drawText(
      context,
      this.buttonFont, 
      this.centerX - this.BUTTON_RADIUS / 2 - 16,
      this.centerY - this.BUTTON_RADIUS / 2 + 4,
      this.BUTTON_RADIUS + 20,
      this.BUTTON_RADIUS / 2 + 4
    );
    context.restore();
    // ----------
  };

  /**
   * 开始旋转
   */
  rotateWheel() {
    this._spinningTime += 10;

    if (this.startRadian >= this._spinningChange) {
      this._isAnimate = false;
      if (this.finish) this.finish(this._awardedIndex, this.awards);
      return;
    }
    
    const easeStep = this.easingFunc(this._spinningTime, 0, this._spinningChange, this._spinTotalTime);
    
    this.startRadian += ((this._spinningChange - easeStep) * (Math.PI / 180));
   
    if (this.startRadian > this._spinningChange) {
      this.startRadian = this._spinningChange
    }

    this.drawLuckyWheel();
    window.requestAnimationFrame(this.rotateWheel.bind(this));
  };

  easingFunc(...args) {
    if (this.animation) {
      return this.animation(...args)
    }
    return super.easeOut(...args)
  };

  /**
   * 获取奖品的值
   */
  getValue() {
    let degrees = this.startRadian * 180 / Math.PI + 90,
      arcd = this.AWARD_RADIAN * 180 / Math.PI,
      index = Math.floor((360 - degrees % 360) / arcd);

    return index;
  };

  /**
   * 执行旋转，用于绑定在按钮上
   */
  luckyDraw() {
    if (this.fetchAward) {
      this.reset()
      this._isAnimate = true;
      this._spinTotalTime = this.duration;
      this._awardedIndex = this.fetchAward(this.awards)

      if (this._awardedIndex < 0 || this._awardedIndex > this.awards.length - 1) {
        throw new Error('Beyond the scope of awards.');
      }

      this._spinningChange = this.getAwardedEndRadian(this._awardedIndex, this.awards)
      this.rotateWheel();
    } else {
      throw new Error('fetchAward function is required.')
    }
  };

  /**
   * 计算某个指定奖品的旋转所需弧度数
   * @author hongwenqing(elenh)
   * @date 
   * @param {number} index 获奖奖品索引
   * @param {Array of Object} awards 奖品列表
   * @return {number} 弧度数
   */
  getAwardedEndRadian(index, awards) {
    const arrow_deg = 270
    const award_len = awards.length
    const per_rad = (360 / award_len)
    const per_rad_half = per_rad / 2

    const per_deg_arr = awards.reduce((init) => {
      const prev = init[init.length - 1]
      let deg = 0

      if (prev) {
        deg = prev + per_rad
      } else {
        deg = this.startRadian + per_rad_half
      }

      init.push(deg)
      
      return init
    }, [])

    const per_end_deg_arr = per_deg_arr.map(deg => {
      if (deg < arrow_deg) {
        return arrow_deg - deg
      } else if (deg > arrow_deg) {
        return arrow_deg + (90 - (deg - arrow_deg))
      }

      return deg
    })

    return (per_end_deg_arr[index] + 360 * 6) * (Math.PI / 180)
  };

  /**
   * 重置转盘状态
   */
  reset() {
    this.startRadian = 0;
    this._spinningTime = 0;
  };

  /**
   * 初始化转盘
   */
  render() {
    const context = this.ctx;
    this._canvasStyle = this.canvas.getAttribute('style');
    this.drawLuckyWheel();

    ['touchstart', 'mousedown'].forEach((event) => {
      this.canvas.addEventListener(event, (e) => {
        if (!this._isAnimate) {
          let loc = super.windowToCanvas(this.canvas, e);
          context.beginPath();
          context.arc(this.centerX, this.centerY, this.BUTTON_RADIUS, 0, Math.PI * 2, false);
          if (context.isPointInPath(loc.x, loc.y)) {
            this.luckyDraw(context);
          }
        }
      })
    });

    this.canvas.addEventListener('mousemove', (e) => {
      let loc = super.windowToCanvas(this.canvas, e);
      context.beginPath();
      context.arc(this.centerX, this.centerY, this.BUTTON_RADIUS, 0, Math.PI * 2, false);
      if (context.isPointInPath(loc.x, loc.y)) {
        this.canvas.setAttribute('style', `cursor: pointer;${this._canvasStyle}`);
      } else {
        this.canvas.setAttribute('style', this._canvasStyle);
      }
    });
  }
}
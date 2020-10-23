import Global from 'src/mixin'
import { isHtmlElement } from 'src/utils'

export default class LuckySudoku extends Global {
  constructor (el, options) {
    super();

    this.canvas = isHtmlElement(el) ? el : document.querySelector(el);
    this.ctx = this.canvas.getContext('2d');
    
    this.awards =           options.awards; // 奖项列表
    this.sudokuSize =       options.sudokuSize || this.canvas.width; // 九宫格宽度大小
    this.sudokuItemRadius = options.sudokuItemRadius || 8; // 奖项方块圆角值

    this.sudokuItemUnactiveColor = options.sudokuItemUnactiveColor             || 'rgb(255, 235, 236)';
    this.sudokuItemUnactiveTxtColor = options.sudokuItemUnactiveTxtColor       || 'rgb(48, 44, 43)';
    this.sudokuItemUnactiveShadowColor = options.sudokuItemUnactiveShadowColor || 'rgb(255, 193, 200)';

    this.sudokuItemActiveColor = options.sudokuItemActiveColor                 || 'rgb(254, 150, 51)';
    this.sudokuItemActiveTxtColor = options.sudokuItemActiveTxtColor           || 'rgb(255, 255, 255)';
    this.sudokuItemActiveShadowColor = options.sudokuItemActiveShadowColor     || 'rgb(255, 193, 200)';

    this.hasButton = options.hasButton || true; // 是否渲染抽奖触发按钮
    this.buttonFont = options.buttonFont || 'START'; // 按钮文字
    this.buttonColor = options.buttonColor             || 'rgb(255, 216, 1)';  // 按钮颜色
    this.buttonTextColor = options.buttonTextColor       || 'rgb(172, 97, 1)';   // 按钮文字颜色
    this.buttonShadowColor = options.buttonShadowColor || 'rgb(253, 177, 1)';  // 按钮阴影颜色

    this.duration = options.duration || 4000; // 动画时间
    this.velocity = options.velocity || 300;  // 动画峰值
    this.finish = options.finish;             // 动画完成回调
    this.fetchAward = options.fetchAward;     // 获取中奖项索引
    this.beforeStart = options.beforeStart || function(done) { done() }; // 抽奖开始前钩子函数
    this.animation = options.animation; // 缓动函数

    // 宫格的绘制步骤: 通过画布的 4 个顶点，分4步进行绘制。

    this.AWARDS_ROW_LENGTH = Math.floor((this.awards.length) / 4) + 1; // n * n 的奖项，例如： 9 宫格就是 3*3的。
    this.AWARDS_STEP = this.AWARDS_ROW_LENGTH - 1; // 该变量表示：每一步，绘制多少个奖项块
    this.AWARDS_LEN =  this.AWARDS_STEP * 4; // 奖品个数，等同于 this.awards.length

    this.LETF_TOP_POINT =     0;
    this.RIGHT_TOP_POINT =    this.AWARDS_STEP;
    this.RIGHT_BOTTOM_POINT = this.AWARDS_STEP * 2;
    this.LEFT_BOTTOM_POINT =  this.AWARDS_STEP * 2 + this.AWARDS_STEP;

    this.SUDOKU_ITEM_MARGIN =   (this.sudokuSize / this.AWARDS_ROW_LENGTH) / 6; // 奖项之间的间距值
    this.SUDOKU_ITEM_SIZE =     (this.sudokuSize / this.AWARDS_ROW_LENGTH) - this.SUDOKU_ITEM_MARGIN; // 奖项块的大小值
    this.SUDOKU_ITEM_TEXT_STYLE = `bold ${this.SUDOKU_ITEM_SIZE * .12}px Helvetica`; // 奖项块的文本样式

    this.BUTTON_SIZE = this.sudokuSize - (this.SUDOKU_ITEM_SIZE * 2 + this.SUDOKU_ITEM_MARGIN * 3); // 抽奖按钮大小值
    this.BUTTON_TEXT_STYLE = `bold ${this.BUTTON_SIZE * .12}px Helvetica`; // 抽奖按钮文本样式

    this._positions = []; // 各奖项块位置坐标
    this._buttonPosition = {}; // 按钮坐标

    this._isAnimate = false; // 是否抽奖进行中
    this._jumpIndex = 0; // 当前跳动奖项块索引值 Math.floor(Math.random() * this.AWARDS_LEN)
    this._jumpingTime = 0; // 当前动画时间点
    this._jumpingTimeStep = 100 / (this.AWARDS_LEN / 8); // 动画跳动时间叠加步数值
    this._jumpTotalTime;
    this._jumpChange;
    this._awardedIndex; // 当前中奖项索引

    this._canvasStyle = '';

    if (this.canvas && this.ctx) {
      this.render()
    }
  };

  /**
   * 绘制宫格
   * @author hongwenqing(elenh)
   */
  draw() {
    const context = this.ctx;

      context.clearRect(0, 0, context.canvas.width, context.canvas.height);

      // 顶点坐标
      let maxPosition = this.AWARDS_STEP * this.SUDOKU_ITEM_SIZE + this.AWARDS_STEP * this.SUDOKU_ITEM_MARGIN;
      
      for (let i = 0; i < this.AWARDS_LEN; i++) {
          // ----- 左上顶点
          if (i >= this.LETF_TOP_POINT && i < this.RIGHT_TOP_POINT) {
              let row = i,
                  x = row * this.SUDOKU_ITEM_SIZE + row * this.SUDOKU_ITEM_MARGIN,
                  y = 0;

              this._positions.push({x, y});

              this.drawSudokuItem(
                  context,
                  x, y,
                  this.SUDOKU_ITEM_SIZE,
                  this.sudokuItemRadius,
                  this.awards[i].type, this.awards[i].content,
                  this.SUDOKU_ITEM_TEXT_STYLE,
                  this.sudokuItemUnactiveTxtColor,
                  this.sudokuItemUnactiveColor,
                  this.sudokuItemUnactiveShadowColor
              )
          }
          // -----

          // ----- 右上顶点
          if (i >= this.RIGHT_TOP_POINT && i < this.RIGHT_BOTTOM_POINT) {
              let row = Math.abs(this.AWARDS_STEP - i),
                  x = maxPosition,
                  y = row * this.SUDOKU_ITEM_SIZE + row * this.SUDOKU_ITEM_MARGIN;

              this._positions.push({x, y});

              this.drawSudokuItem(
                  context,
                  x, y,
                  this.SUDOKU_ITEM_SIZE,
                  this.sudokuItemRadius,
                  this.awards[i].type, this.awards[i].content,
                  this.SUDOKU_ITEM_TEXT_STYLE,
                  this.sudokuItemUnactiveTxtColor,
                  this.sudokuItemUnactiveColor,
                  this.sudokuItemUnactiveShadowColor
              )
          }
          // -----

          // ----- 左下顶点
          if (i >= this.RIGHT_BOTTOM_POINT && i < this.LEFT_BOTTOM_POINT) {
              let row = Math.abs(this.AWARDS_STEP * 2 - i),
                  reverseRow = Math.abs(row - this.AWARDS_STEP),
                  x = reverseRow * this.SUDOKU_ITEM_SIZE + reverseRow * this.SUDOKU_ITEM_MARGIN,
                  y = maxPosition;

              this._positions.push({x, y});

              this.drawSudokuItem(
                  context,
                  x, y,
                  this.SUDOKU_ITEM_SIZE,
                  this.sudokuItemRadius,
                  this.awards[i].type, this.awards[i].content,
                  this.SUDOKU_ITEM_TEXT_STYLE,
                  this.sudokuItemUnactiveTxtColor,
                  this.sudokuItemUnactiveColor,
                  this.sudokuItemUnactiveShadowColor
              )
          }
          // -----

          // ----- 左上顶点
          if (i >= this.LEFT_BOTTOM_POINT) {
              let row = Math.abs(this.AWARDS_STEP * 3 - i),
                  reverseRow = Math.abs(row - this.AWARDS_STEP),
                  x = 0,
                  y = reverseRow * this.SUDOKU_ITEM_SIZE + reverseRow * this.SUDOKU_ITEM_MARGIN;

              this._positions.push({x, y});

              this.drawSudokuItem(
                  context,
                  x, y,
                  this.SUDOKU_ITEM_SIZE,
                  this.sudokuItemRadius,
                  this.awards[i].type, this.awards[i].content,
                  this.SUDOKU_ITEM_TEXT_STYLE,
                  this.sudokuItemUnactiveTxtColor,
                  this.sudokuItemUnactiveColor,
                  this.sudokuItemUnactiveShadowColor
              )
          }
      };
  };

  /**
   * 绘制奖项块
   * @author hongwenqing(elenh)
   */
  drawSudokuItem(context, x, y, size, radius, type, content, txtSize, txtColor, bgColor, shadowColor) {
      // ----- 绘制方块
      context.save();
      context.fillStyle = bgColor;
      context.shadowOffsetX = 0;
      context.shadowOffsetY = 4;
      context.shadowBlur = 0;
      context.shadowColor = shadowColor;
      context.beginPath();
      super.roundedRect(
          context, 
          x, y,
          size, size, 
          radius
      );
      context.fill();
      context.restore();
      // -----

      // ----- 绘制图片与文字
      if (content) {
          if (type === 'image') {
              let image = new Image();
                  image.src = content;

              function drawImage() {
                  context.drawImage(
                      image, 
                      x + (size * .2 / 2), y + (size * .2 / 2), 
                      size * .8, size * .8
                  );
              };

              if (!image.complete) {
                  image.onload = function (e) {
                      drawImage();
                  }
              } else {
                  drawImage();
              }
          }
          else if (type === 'text' || type === 'losing') {
              context.save();
              context.fillStyle = txtColor;
              context.font = txtSize;
              context.translate(
                  x + this.SUDOKU_ITEM_SIZE / 2 - context.measureText(content).width / 2,
                  y + this.SUDOKU_ITEM_SIZE / 2 + 6
              );
              context.fillText(content, 0, 0);
              context.restore();
          }
      }
      // -----
  };

  /**
   * 绘制抽奖按钮
   * @author hongwenqing(elenh)
   */
  drawButton() {
    const context = this.ctx;

    let x = this.SUDOKU_ITEM_SIZE + this.SUDOKU_ITEM_MARGIN,
        y = this.SUDOKU_ITEM_SIZE + this.SUDOKU_ITEM_MARGIN;

    // ----- 绘制背景
    context.save();
    context.fillStyle = this.buttonColor;
    context.shadowOffsetX = 0;
    context.shadowOffsetY = 4;
    context.shadowBlur = 0;
    context.shadowColor = this.buttonShadowColor;
    context.beginPath();
    super.roundedRect(
      context, x, y,
      this.BUTTON_SIZE, this.BUTTON_SIZE, 
      this.sudokuItemRadius,
      this.buttonColor,
      this.buttonShadowColor
    );
    context.fill();
    context.restore();
    // -----

    // ----- 绘制文字
    context.save();
    context.fillStyle = this.buttonTextColor;
    context.font = this.BUTTON_TEXT_STYLE;
    context.translate(
        x + this.BUTTON_SIZE / 2 - context.measureText(this.buttonFont).width / 2, 
        y + this.BUTTON_SIZE / 2 + 10
    );
    context.fillText(this.buttonFont, 0, 0);
    context.restore();
    // -----

    this._buttonPosition = {x, y};
  };

  createButtonPath() {
    const context = this.ctx;

    context.beginPath();
    super.roundedRect(
      context,
      this._buttonPosition.x, this._buttonPosition.y,
      this.BUTTON_SIZE, this.BUTTON_SIZE, 
      this.sudokuItemRadius
    );
  };

  /**
   * 执行动画
   * @author hongwenqing(elenh)
   */
  sudokuItemMove() {
    const context = this.ctx;

    this._isAnimate = true;

    this.draw();
    if (this.hasButton) this.drawButton();
    this.drawSudokuItem(
      context,
      this._positions[this._jumpIndex].x, 
      this._positions[this._jumpIndex].y,
      this.SUDOKU_ITEM_SIZE, 
      this.sudokuItemRadius, 
      this.awards[this._jumpIndex].type,
      this.awards[this._jumpIndex].content,
      this.SUDOKU_ITEM_TEXT_STYLE,
      this.sudokuItemActiveTxtColor,
      this.sudokuItemActiveColor,
      this.sudokuItemActiveShadowColor
    );

    if (this._jumpIndex < this.AWARDS_LEN - 1)        this._jumpIndex ++;
    else if (this._jumpIndex >= this.AWARDS_LEN -1)  this._jumpIndex = 0;

    this._jumpingTime += this._jumpingTimeStep;

    if (this._jumpingTime <= this._jumpTotalTime) {
      const step = this.easingFunc(this._jumpingTime, 0, this._jumpChange, this._jumpTotalTime);
    
      setTimeout(
        this.sudokuItemMove.bind(this),
        step + 50
      );
    } else {
      this._isAnimate = false;
      if (this.finish) this.finish(this._awardedIndex, this.awards)
    }
    
  };

  /**
   * 开始抽奖
   * @author hongwenqing(elenh)
   */
  luckyDraw() {
    this.beforeStart((awardedIndex) => {
      if (awardedIndex >= 0) {
        this._awardedIndex = awardedIndex;
      } else if(this.fetchAward) {
        this._awardedIndex = this.fetchAward(this.awards);
      } else {
        throw new Error('if you do not use the beforeStart hook, then fetchAward function is required.');
      }

      if (this._awardedIndex < 0 || this._awardedIndex > this.awards.length - 1) {
        throw new Error('Beyond the scope of awards.');
      }

      this._jumpIndex = 0;
      this._jumpingTime = 0;
      this._jumpChange = Math.random() * 3 + this.velocity;
      this._jumpTotalTime = this.duration + (this._jumpingTimeStep * this._awardedIndex);
      
      this.sudokuItemMove();
    })
  };

  easingFunc(...args) {
    if (this.animation) {
      return this.animation(...args)
    }
    return super.easeOut(...args)
  };

  /**
   * 更新奖项列表
   */
  updateAwards(awards) {
    this.awards = awards;
    this.draw()
  };

  /**
   * 销毁
   * @author hongwenqing(elenh)
   */
  destroy() {
    ['touchstart', 'mousedown'].forEach(name => {
      this.canvas.removeEventListener(name, this.btnClickListener)
    })

    this.canvas.removeEventListener('mousemove', this.btnMoveListener)
  };

  btnClickListener(e) {
    const canvas = this.canvas;
    const context = this.ctx;

    let loc = super.windowToCanvas(canvas, e);

    this.createButtonPath();

    if (context.isPointInPath(loc.x, loc.y) && !this._isAnimate) {
      this.luckyDraw();
    }
  };

  btnMoveListener(e) {
    const canvas = this.canvas;
    const context = this.ctx;

    let loc2 = super.windowToCanvas(canvas, e);
    this.createButtonPath();

    if (context.isPointInPath(loc2.x, loc2.y)) {
        canvas.setAttribute('style', `cursor: pointer;${this._canvasStyle}`);
    } else {
        canvas.setAttribute('style', this._canvasStyle);
    }
  };

  render() {
    this.destroy();

    const canvas = this.canvas;
    
    this._canvasStyle = canvas.getAttribute('style') || '';
    this.draw();

    if (this.hasButton) {
      this.drawButton();
        
      ['mousedown', 'touchstart'].forEach((event) => {
        canvas.addEventListener(event, this.btnClickListener.bind(this));
      });

      canvas.addEventListener('mousemove', this.btnMoveListener.bind(this));
    }
  };
}
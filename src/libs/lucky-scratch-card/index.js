import Global from 'src/mixin'
import { isHtmlElement } from 'src/utils'

export default class ScratchCard extends Global {
  constructor (el, options) {
    super();

    this.canvas = isHtmlElement(el) ? el : document.querySelector(el);
    this.ctx = this.canvas.getContext('2d');

    this.style = options.style;
    this.awardBackgroundImage = options.awardBackgroundImage;

    this.eraserSize = options.eraserSize || 15;
    this.coverColor = options.coverColor || '#b5b5b5';

    this._dragging = false;

    if (this.canvas && this.ctx) {
      this.render()
    }
  };

  /**
   * 绘制刮涂层
   */
  drawCover() {
    const context = this.ctx;

    context.save();
    context.fillStyle = this.coverColor;
    context.beginPath();
    context.rect(0, 0, context.canvas.width, context.canvas.height);
    context.fill();
    context.restore();
  };

  /**
   * 绘制橡皮擦
   * @param {Obj} context 
   * @param {Obj} loc 
   */
  drawEraser(context, loc) {
      context.save();
      context.beginPath();
      context.arc(loc.x, loc.y, this.eraserSize, 0, Math.PI * 2, false);
      context.clip();
      context.clearRect(0, 0, context.canvas.width, context.canvas.height);
      context.restore();
  };

  drawAwardBackgroundImage() {
    this.canvas.setAttribute(
      'style', 
      `background: url(${this.awardBackgroundImage}) no-repeat center / cover;${this.style}`
    )
  };

  render() {
    const canvas = this.canvas;
    const context = this.ctx;

    this.drawCover();
    this.drawAwardBackgroundImage(canvas);

    ['touchstart', 'mousedown'].forEach((event) => {
        canvas.addEventListener(event, (e) => {
            let loc = super.windowToCanvas(canvas, e);
            this._dragging = true;
            this.drawEraser(context, loc);
        })
    });

    ['touchmove', 'mousemove'].forEach((event) => {
        canvas.addEventListener(event, (e) => {
            let loc;
            if (this._dragging) {
                loc = super.windowToCanvas(canvas, e);
                this.drawEraser(context, loc);
            }
        })
    });


    ['touchend', 'mouseup'].forEach((event) => {
        canvas.addEventListener(event, (e) => {
            this._dragging = false;
        })
    });
  };
}
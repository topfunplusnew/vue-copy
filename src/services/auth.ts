import type { ITokenConfig } from '@/types/service';

export class Auth {
  public key: string;
  public expire: number;
  private _token: string | null;
  constructor() {
    this.key = 'access-token';
    this.expire = 12 * 3600 * 1000;
    this._token = null;
  }
  /**
   * 重新定义token
   * @param config
   */
  init(config: ITokenConfig | string) {
    if (typeof config === 'string') {
      this.key = config;
    } else if (typeof config === 'object') {
      this.key = config.name;
      this.expire = config.expire;
    }
  }
  /**
   * 获取token
   */
  get() {
    if (Date.now() - Number(localStorage.getItem(`${this.key}-expired`)) > 12 * 3600 * 1000) {
      this.del();
    }
    if (!this._token) this._token = localStorage.getItem(this.key);
    return this._token;
  }
  /**
   * 设置token
   */
  set(p: string) {
    this._token = p;
    localStorage.setItem(this.key, p);
    //设置到期时间
    localStorage.setItem(`${this.key}-expired`, Date.now().toString());
  }
  /**
   * 删除token
   */
  del() {
    this._token = null;
    localStorage.removeItem(this.key);
    localStorage.removeItem(`${this.key}-expired`);
  }
}

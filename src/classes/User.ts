import { IUser } from "@/interfaces/IUser";

export default class User {
  private UserInfo: IUser;
  constructor(id: string) {
    this.UserInfo = { id: id, pw: "" };
  }

  public login() {
    return true;
  }
  public getUserInfo() {
    return this.UserInfo;
  }
}

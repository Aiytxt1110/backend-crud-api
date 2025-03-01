export interface RegisterUserInput {
  username: string;
  email: string;
  password: string;
}

export interface LoginUserInput {
  email: string;
  password: string;
}

export interface UserAuthResponse {
  _id: string;
  username: string;
  email: string;
  token: string;
}
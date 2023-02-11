/* eslint-disable @typescript-eslint/no-explicit-any */
import { AuthPayload, IAuthDocument } from '@auth/interfaces/auth.interface';
import { Response } from 'express';

//a function that returns a object, mock Request object
export const authMockRequest = (sessionData: IJWT, body: IAuthMock, currentUser?: AuthPayload| null, params?: any) => ({
  session: sessionData,
  body,
  currentUser,
  params
});

//a function that returns a object, mock Response object
export const authMockResponse = (): Response => {
  const res: Response = {} as Response;
  //jest.fn().mockReturnValue to create a mock function that returns a specific value for testing purposes
  //jest.fn() creates a new mock function that does not have any behavior specified.
  /**
   * @param: res, value that should be returned when the mock function is called, e.g, call res.status() will return res
   */
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

export interface IJWT {
  jwt?: string;
}


export interface IAuthMock {
  _id?: string;
  username?: string;
  email?: string;
  uId?: string;
  password?: string;
  avatarColor?: string;
  avatarImage?: string;
  createdAt?: Date | string;
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
  quote?: string;
  work?: string;
  school?: string;
  location?: string;
  facebook?: string;
  instagram?: string;
  twitter?: string;
  youtube?: string;
  messages?: boolean;
  reactions?: boolean;
  comments?: boolean;
  follows?: boolean;
}

export const authUserPayload: AuthPayload = {
  userId: '60263f14648fed5246e322d9',
  uId: '1621613119252066',
  username: 'Manny',
  email: 'manny@me.com',
  avatarColor: '#9c27b0',
  iat: 12345
};

export const authMock = {
  _id: '60263f14648fed5246e322d3',
  uId: '1621613119252066',
  username: 'Manny',
  email: 'manny@me.com',
  avatarColor: '#9c27b0',
  createdAt: '2022-08-31T07:42:24.451Z',
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  save: () => {},
  comparePassword: () => false
} as unknown as IAuthDocument;


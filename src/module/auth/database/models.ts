export interface JwtPayload {
  id: number;
  email: string;
  role: string;
  isAdmin?: boolean;
  permissions?: string[];
}

export interface AuthResponse {
  token: string;
  user: {
    id: number;
    email: string;
  }
}

export interface User {
  token: string;
  user: {
    id: number;
    email: string;
  };
}

export interface Admin {
  token: string;
  user: {
    id: number;
    email: string;
    isAdmin: boolean;
    permissions?: string[];
  };
}

export interface User {
  id?: number;
  name: string;
  email: string;
  password?: string;
  role: 'admin' | 'employee' | 'developer' | 'designer' | 'tester' | 'pm';
  phone?: string;
  department?: string;
  profile_image?: string;
  created_at?: string;
  updated_at?: string;
}

export type UserRole = 'admin' | 'employee';
export type UserStatus = 'pending' | 'approved' | 'rejected';

export interface AppUser {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  phone?: string;
  position?: string;
  cpf?: string;
  matricula?: string;
  createdAt: Date;
}

export interface Vehicle {
  id: string;
  name: string;
  plate: string;
  type: 'guindaste' | 'caminhao' | 'veiculo';
  year: number;
  status: 'active' | 'maintenance' | 'inactive';
  createdAt: Date;
}

export interface Maintenance {
  id: string;
  vehicleId: string;
  type: 'preventive' | 'corrective';
  description: string;
  photoUrls: string[];
  createdBy: string;
  createdAt: Date;
  scheduledDate?: Date;
  completedAt?: Date;
  status: 'pending' | 'in_progress' | 'completed';
}

export interface EmployeeDocument {
  id: string;
  employeeId: string;
  employeeName: string;
  type: 'exam' | 'attestation';
  description: string;
  fileUrl?: string;
  expirationDate?: Date;
  createdAt: Date;
}
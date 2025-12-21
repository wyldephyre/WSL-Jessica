/**
 * Task type definition
 */

export interface Task {
  id: string;
  title: string;
  text?: string; // legacy field used by older task records
  description?: string;
  completed: boolean;
  priority?: 'high' | 'medium' | 'low';
  dueDate?: Date | string | any; // Firestore Timestamp
  createdAt?: Date | string | any; // Firestore Timestamp
  updatedAt?: Date | string | any; // Firestore Timestamp
  category?: string;
  tags?: string[];
}


/**
 * Task type definition
 */

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority?: 'high' | 'medium' | 'low';
  dueDate?: Date | string | any; // Firestore Timestamp
  createdAt?: Date | string | any; // Firestore Timestamp
  updatedAt?: Date | string | any; // Firestore Timestamp
  category?: string;
  tags?: string[];
}


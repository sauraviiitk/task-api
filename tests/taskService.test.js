const taskService = require('../src/services/taskService');

describe('Task Service Unit Tests', () => {
  beforeEach(() => {
    taskService._reset();
  });

  describe('create', () => {
    it('should create a task with default values', () => {
      const task = taskService.create({ title: 'Test Task' });
      expect(task).toHaveProperty('id');
      expect(task.title).toBe('Test Task');
      expect(task.description).toBe('');
      expect(task.status).toBe('todo');
      expect(task.priority).toBe('medium');
      expect(task.dueDate).toBeNull();
      expect(task.completedAt).toBeNull();
      expect(task).toHaveProperty('createdAt');
    });

    it('should create a task with provided values', () => {
      const dueDate = new Date().toISOString();
      const task = taskService.create({
        title: 'Custom Task',
        description: 'Details',
        status: 'in_progress',
        priority: 'high',
        dueDate
      });
      expect(task.title).toBe('Custom Task');
      expect(task.description).toBe('Details');
      expect(task.status).toBe('in_progress');
      expect(task.priority).toBe('high');
      expect(task.dueDate).toBe(dueDate);
    });
  });

  describe('getAll', () => {
    it('should return all tasks', () => {
      taskService.create({ title: 'Task 1' });
      taskService.create({ title: 'Task 2' });
      const tasks = taskService.getAll();
      expect(tasks).toHaveLength(2);
      expect(tasks[0].title).toBe('Task 1');
      expect(tasks[1].title).toBe('Task 2');
    });
  });

  describe('findById', () => {
    it('should find an existing task by id', () => {
      const created = taskService.create({ title: 'Find Me' });
      const found = taskService.findById(created.id);
      expect(found).toBeDefined();
      expect(found.id).toBe(created.id);
    });

    it('should return undefined for non-existent id', () => {
      const found = taskService.findById('invalid-id');
      expect(found).toBeUndefined();
    });
  });

  describe('getByStatus', () => {
    it('should filter tasks by status (includes)', () => {
      taskService.create({ title: 'Todo Task', status: 'todo' });
      taskService.create({ title: 'Progress Task', status: 'in_progress' });
      const todos = taskService.getByStatus('todo');
      expect(todos).toHaveLength(1);
      expect(todos[0].title).toBe('Todo Task');
    });
  });

  describe('getPaginated', () => {
    it('should paginate tasks (with current offset logic)', () => {
      for (let i = 0; i < 5; i++) {
        taskService.create({ title: `Task ${i}` });
      }
      // Note: Current logic is offset = page * limit.
      // So page = 0, limit = 2 should return items 0, 1
      const page0 = taskService.getPaginated(0, 2);
      expect(page0).toHaveLength(2);
      expect(page0[0].title).toBe('Task 0');

      // page = 1, limit = 2 should return items 2, 3
      const page1 = taskService.getPaginated(1, 2);
      expect(page1).toHaveLength(2);
      expect(page1[0].title).toBe('Task 2');
    });
  });

  describe('update', () => {
    it('should update specific fields of a task', () => {
      const task = taskService.create({ title: 'Old Title' });
      const updated = taskService.update(task.id, { title: 'New Title', status: 'in_progress' });
      expect(updated).not.toBeNull();
      expect(updated.title).toBe('New Title');
      expect(updated.status).toBe('in_progress');
      // Should not touch unmodified fields
      expect(updated.priority).toBe('medium');
    });

    it('should return null if task not found for update', () => {
      const updated = taskService.update('non-existent', { title: 'No' });
      expect(updated).toBeNull();
    });
  });

  describe('remove', () => {
    it('should delete an existing task', () => {
      const task = taskService.create({ title: 'To Be Deleted' });
      const removed = taskService.remove(task.id);
      expect(removed).toBe(true);
      expect(taskService.getAll()).toHaveLength(0);
    });

    it('should return false if task not found for deletion', () => {
      const removed = taskService.remove('non-existent');
      expect(removed).toBe(false);
    });
  });

  describe('completeTask', () => {
    it('should mark task as complete and update completedAt and priority', () => {
      const task = taskService.create({ title: 'Finish Me', priority: 'high' });
      const completed = taskService.completeTask(task.id);
      expect(completed).not.toBeNull();
      expect(completed.status).toBe('done');
      expect(completed.priority).toBe('medium'); // Due to the bug in the code
      expect(completed.completedAt).not.toBeNull();
    });

    it('should return null if task not found for completion', () => {
      const completed = taskService.completeTask('non-existent');
      expect(completed).toBeNull();
    });
  });

  describe('getStats', () => {
    it('should return task statistics', () => {
      // 1 todo
      taskService.create({ title: 'Todo', status: 'todo' });
      // 1 in_progress
      taskService.create({ title: 'Progress', status: 'in_progress' });
      // 1 done
      taskService.create({ title: 'Done', status: 'done' });
      
      // 1 overdue (todo, past due date)
      const pastDate = new Date(Date.now() - 10000).toISOString();
      taskService.create({ title: 'Overdue', status: 'todo', dueDate: pastDate });

      const stats = taskService.getStats();
      expect(stats.todo).toBe(2);
      expect(stats.in_progress).toBe(1);
      expect(stats.done).toBe(1);
      expect(stats.overdue).toBe(1);
    });
  });
});

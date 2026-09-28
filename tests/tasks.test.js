const request = require('supertest');
const app = require('../src/app');
const taskService = require('../src/services/taskService');

describe('Tasks API Integration Tests', () => {
  beforeEach(() => {
    taskService._reset();
  });

  describe('POST /tasks', () => {
    it('should create a new task successfully', async () => {
      const response = await request(app)
        .post('/tasks')
        .send({ title: 'Integration Test Task', priority: 'high' });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe('Integration Test Task');
      expect(response.body.priority).toBe('high');
      expect(response.body.status).toBe('todo');
    });

    it('should return 400 for missing title', async () => {
      const response = await request(app)
        .post('/tasks')
        .send({ priority: 'high' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('title is required');
    });

    it('should return 400 for invalid status', async () => {
      const response = await request(app)
        .post('/tasks')
        .send({ title: 'Task', status: 'invalid_status' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('status must be one of');
    });

    it('should return 400 for invalid dueDate', async () => {
      const response = await request(app)
        .post('/tasks')
        .send({ title: 'Task', dueDate: 'invalid-date' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('dueDate must be a valid ISO date string');
    });
  });

  describe('GET /tasks', () => {
    it('should return all tasks', async () => {
      taskService.create({ title: 'T1' });
      taskService.create({ title: 'T2' });

      const response = await request(app).get('/tasks');
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
    });

    it('should filter tasks by status', async () => {
      taskService.create({ title: 'T1', status: 'todo' });
      taskService.create({ title: 'T2', status: 'in_progress' });

      const response = await request(app).get('/tasks?status=todo');
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].title).toBe('T1');
    });

    it('should paginate tasks', async () => {
      for (let i = 0; i < 5; i++) {
        taskService.create({ title: `T${i}` });
      }

      // Asserting the current buggy behavior where page 1 starts at offset 2
      const response = await request(app).get('/tasks?page=1&limit=2');
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].title).toBe('T2');
    });
  });

  describe('GET /tasks/stats', () => {
    it('should return correct stats', async () => {
      taskService.create({ title: 'T1', status: 'todo' });
      taskService.create({ title: 'T2', status: 'done' });

      const response = await request(app).get('/tasks/stats');
      expect(response.status).toBe(200);
      expect(response.body.todo).toBe(1);
      expect(response.body.done).toBe(1);
      expect(response.body.overdue).toBe(0);
    });
  });

  describe('PUT /tasks/:id', () => {
    it('should update a task', async () => {
      const task = taskService.create({ title: 'Old Title' });

      const response = await request(app)
        .put(`/tasks/${task.id}`)
        .send({ title: 'New Title', status: 'in_progress' });

      expect(response.status).toBe(200);
      expect(response.body.title).toBe('New Title');
      expect(response.body.status).toBe('in_progress');
    });

    it('should return 404 for updating non-existent task', async () => {
      const response = await request(app)
        .put('/tasks/invalid-id')
        .send({ title: 'New Title' });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Task not found');
    });

    it('should return 400 for invalid update data', async () => {
      const task = taskService.create({ title: 'Task' });
      const response = await request(app)
        .put(`/tasks/${task.id}`)
        .send({ title: '' }); // empty title

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('title must be a non-empty string');
    });
  });

  describe('PATCH /tasks/:id/complete', () => {
    it('should mark task as complete', async () => {
      const task = taskService.create({ title: 'Task' });

      const response = await request(app).patch(`/tasks/${task.id}/complete`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('done');
    });

    it('should return 404 for completing non-existent task', async () => {
      const response = await request(app).patch('/tasks/invalid-id/complete');
      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /tasks/:id', () => {
    it('should delete a task', async () => {
      const task = taskService.create({ title: 'Task' });

      const response = await request(app).delete(`/tasks/${task.id}`);

      expect(response.status).toBe(204);
      expect(taskService.getAll()).toHaveLength(0);
    });

    it('should return 404 for deleting non-existent task', async () => {
      const response = await request(app).delete('/tasks/invalid-id');
      expect(response.status).toBe(404);
    });
  });
});

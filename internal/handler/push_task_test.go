package handler

import (
"bytes"
"encoding/json"
"fmt"
"net/http"
"net/http/httptest"
"testing"

"github.com/game-marketing-platform/internal/model"
"github.com/gin-gonic/gin"
)

type mockPushTaskService struct {
	createTaskFn    func(task *model.PushTask) (int64, error)
	updateTaskFn    func(task *model.PushTask) error
	getTaskByIDFn   func(taskID int64) (*model.PushTask, error)
	listTasksFn     func(projectID int64, status string, page, pageSize int) ([]*model.PushTask, int64, error)
	deleteTaskFn    func(taskID int64) error
	estimateUsersFn func(projectID int64, filters model.JSONB) (int64, error)
}

func (m *mockPushTaskService) CreateTask(task *model.PushTask) (int64, error) {
	return m.createTaskFn(task)
}

func (m *mockPushTaskService) UpdateTask(task *model.PushTask) error {
	return m.updateTaskFn(task)
}

func (m *mockPushTaskService) GetTaskByID(taskID int64) (*model.PushTask, error) {
	return m.getTaskByIDFn(taskID)
}

func (m *mockPushTaskService) ListTasks(projectID int64, status string, page, pageSize int) ([]*model.PushTask, int64, error) {
	return m.listTasksFn(projectID, status, page, pageSize)
}

func (m *mockPushTaskService) DeleteTask(taskID int64) error {
	if m.deleteTaskFn != nil {
		return m.deleteTaskFn(taskID)
	}
	return nil
}

func (m *mockPushTaskService) EstimateUsers(projectID int64, filters model.JSONB) (int64, error) {
	return m.estimateUsersFn(projectID, filters)
}

func setupRouter(h PushTaskHandler) *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	tasks := r.Group("/api/v1/push-tasks")
	tasks.POST("", h.CreateTask)
	tasks.GET("", h.ListTasks)
	tasks.PUT("/:taskId", h.UpdateTask)
	tasks.GET("/:taskId", h.GetTask)
	tasks.DELETE("/:taskId", h.DeleteTask)
	tasks.POST("/estimate", h.EstimateUsers)
	tasks.GET("/topics", h.GetTopics)
	tasks.GET("/events", h.GetEvents)
	tasks.GET("/templates", h.GetTemplates)
	return r
}

func TestCreateTask(t *testing.T) {
	mock := &mockPushTaskService{
		createTaskFn: func(task *model.PushTask) (int64, error) {
			task.TaskID = 1
			return 1, nil
		},
	}
	r := setupRouter(NewPushTaskHandler(mock))
	body, _ := json.Marshal(map[string]interface{}{
"project_id": 1, "task_name": "test", "push_type": "schedule_once",
})
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/v1/push-tasks", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}
	var resp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	if resp["task_id"] == nil {
		t.Error("expected task_id in response")
	}
}

func TestUpdateTask(t *testing.T) {
	mock := &mockPushTaskService{
		updateTaskFn: func(task *model.PushTask) error {
			if task.TaskID != 1 {
				t.Errorf("expected task ID 1, got %d", task.TaskID)
			}
			return nil
		},
	}
	r := setupRouter(NewPushTaskHandler(mock))
	body, _ := json.Marshal(map[string]interface{}{
"task_name": "updated", "push_type": "schedule_repeat",
})
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("PUT", "/api/v1/push-tasks/1", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}
}

func TestGetTask(t *testing.T) {
	mock := &mockPushTaskService{
		getTaskByIDFn: func(taskID int64) (*model.PushTask, error) {
			return &model.PushTask{TaskID: taskID, TaskName: "test task", Status: "draft"}, nil
		},
	}
	r := setupRouter(NewPushTaskHandler(mock))
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/push-tasks/1", nil)
	r.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}
	var resp model.PushTask
	json.Unmarshal(w.Body.Bytes(), &resp)
	if resp.TaskName != "test task" {
		t.Errorf("expected 'test task', got %s", resp.TaskName)
	}
}

func TestEstimateUsers(t *testing.T) {
	mock := &mockPushTaskService{
		estimateUsersFn: func(projectID int64, filters model.JSONB) (int64, error) {
			return 15230, nil
		},
	}
	r := setupRouter(NewPushTaskHandler(mock))
	body, _ := json.Marshal(map[string]interface{}{"project_id": 1, "filters": []interface{}{}})
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/v1/push-tasks/estimate", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}
	var resp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	if resp["estimated_count"] != float64(15230) {
		t.Errorf("expected 15230, got %v", resp["estimated_count"])
	}
}

func TestGetTopics(t *testing.T) {
	r := setupRouter(NewPushTaskHandler(&mockPushTaskService{}))
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/push-tasks/topics", nil)
	r.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}
}

func TestGetInvalidTaskID(t *testing.T) {
	r := setupRouter(NewPushTaskHandler(&mockPushTaskService{}))
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/push-tasks/abc", nil)
	r.ServeHTTP(w, req)
	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

func TestCreateTask_InvalidJSON(t *testing.T) {
	r := setupRouter(NewPushTaskHandler(&mockPushTaskService{}))
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/v1/push-tasks", bytes.NewBufferString("{invalid"))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)
	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

func TestCreateTask_ServiceError(t *testing.T) {
	mock := &mockPushTaskService{
		createTaskFn: func(task *model.PushTask) (int64, error) {
			return 0, fmt.Errorf("service error")
		},
	}
	r := setupRouter(NewPushTaskHandler(mock))
	body, _ := json.Marshal(map[string]interface{}{
"project_id": 1, "task_name": "test", "push_type": "schedule_once",
})
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/v1/push-tasks", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)
	if w.Code != http.StatusInternalServerError {
		t.Errorf("expected 500, got %d", w.Code)
	}
}

func TestUpdateTask_InvalidTaskID(t *testing.T) {
	r := setupRouter(NewPushTaskHandler(&mockPushTaskService{}))
	body, _ := json.Marshal(map[string]interface{}{"task_name": "updated"})
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("PUT", "/api/v1/push-tasks/abc", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)
	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

func TestUpdateTask_InvalidJSON(t *testing.T) {
	r := setupRouter(NewPushTaskHandler(&mockPushTaskService{}))
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("PUT", "/api/v1/push-tasks/1", bytes.NewBufferString("{invalid"))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)
	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

func TestUpdateTask_ServiceError(t *testing.T) {
	mock := &mockPushTaskService{
		updateTaskFn: func(task *model.PushTask) error {
			return fmt.Errorf("service error")
		},
	}
	r := setupRouter(NewPushTaskHandler(mock))
	body, _ := json.Marshal(map[string]interface{}{"task_name": "updated"})
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("PUT", "/api/v1/push-tasks/1", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)
	if w.Code != http.StatusInternalServerError {
		t.Errorf("expected 500, got %d", w.Code)
	}
}

func TestGetTask_ServiceError(t *testing.T) {
	mock := &mockPushTaskService{
		getTaskByIDFn: func(taskID int64) (*model.PushTask, error) {
			return nil, fmt.Errorf("service error")
		},
	}
	r := setupRouter(NewPushTaskHandler(mock))
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/push-tasks/1", nil)
	r.ServeHTTP(w, req)
	if w.Code != http.StatusInternalServerError {
		t.Errorf("expected 500, got %d", w.Code)
	}
}

func TestEstimateUsers_InvalidJSON(t *testing.T) {
	r := setupRouter(NewPushTaskHandler(&mockPushTaskService{}))
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/v1/push-tasks/estimate", bytes.NewBufferString("{invalid"))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)
	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", w.Code)
	}
}

func TestEstimateUsers_ServiceError(t *testing.T) {
	mock := &mockPushTaskService{
		estimateUsersFn: func(projectID int64, filters model.JSONB) (int64, error) {
			return 0, fmt.Errorf("service error")
		},
	}
	r := setupRouter(NewPushTaskHandler(mock))
	body, _ := json.Marshal(map[string]interface{}{"project_id": 1, "filters": []interface{}{}})
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/v1/push-tasks/estimate", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)
	if w.Code != http.StatusInternalServerError {
		t.Errorf("expected 500, got %d", w.Code)
	}
}

func TestGetEvents(t *testing.T) {
	r := setupRouter(NewPushTaskHandler(&mockPushTaskService{}))
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/push-tasks/events", nil)
	r.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}
	var resp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	if resp["events"] == nil {
		t.Error("expected events in response")
	}
}

func TestGetTemplates(t *testing.T) {
	r := setupRouter(NewPushTaskHandler(&mockPushTaskService{}))
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/push-tasks/templates", nil)
	r.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}
	var resp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	if resp["templates"] == nil {
		t.Error("expected templates in response")
	}
}

func TestCreateTask_ResponseFormat(t *testing.T) {
	mock := &mockPushTaskService{
		createTaskFn: func(task *model.PushTask) (int64, error) {
			task.TaskID = 42
			return 42, nil
		},
	}
	r := setupRouter(NewPushTaskHandler(mock))
	body, _ := json.Marshal(map[string]interface{}{
"project_id": 1, "task_name": "test", "push_type": "schedule_once",
})
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("POST", "/api/v1/push-tasks", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}
	var resp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	if resp["task_id"] != float64(42) {
		t.Errorf("expected task_id 42, got %v", resp["task_id"])
	}
	if resp["message"] != "Task saved as draft" {
		t.Errorf("expected 'Task saved as draft', got %v", resp["message"])
	}
}

func TestUpdateTask_ResponseFormat(t *testing.T) {
	mock := &mockPushTaskService{
		updateTaskFn: func(task *model.PushTask) error {
			return nil
		},
	}
	r := setupRouter(NewPushTaskHandler(mock))
	body, _ := json.Marshal(map[string]interface{}{"task_name": "updated"})
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("PUT", "/api/v1/push-tasks/1", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}
	var resp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	if resp["message"] != "Task updated successfully" {
		t.Errorf("expected 'Task updated successfully', got %v", resp["message"])
	}
}

func TestGetTask_ResponseFields(t *testing.T) {
	mock := &mockPushTaskService{
		getTaskByIDFn: func(taskID int64) (*model.PushTask, error) {
			return &model.PushTask{
				TaskID:   taskID,
				TaskName: "campaign push",
				Status:   "draft",
				PushType: "schedule_once",
			}, nil
		},
	}
	r := setupRouter(NewPushTaskHandler(mock))
	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/api/v1/push-tasks/1", nil)
	r.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}
	var resp map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &resp)
	if resp["task_name"] != "campaign push" {
		t.Errorf("expected task_name 'campaign push', got %v", resp["task_name"])
	}
	if resp["status"] != "draft" {
		t.Errorf("expected status 'draft', got %v", resp["status"])
	}
	if resp["push_type"] != "schedule_once" {
		t.Errorf("expected push_type 'schedule_once', got %v", resp["push_type"])
	}
}

<?php

namespace App\Http\Controllers;

use App\Services\TaskService;
use Illuminate\Http\Request;

class TaskController extends Controller
{
    protected $taskService;

    public function __construct(TaskService $taskService)
    {
        $this->taskService = $taskService;
    }

    public function index()
    {
        return response()->json($this->taskService->getAllTasks());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'project_id' => 'required|exists:projects,id',
            'employee_id' => 'required|exists:users,id',
            'task_title' => 'required|string|max:150',
            'description' => 'nullable|string',
            'priority' => 'sometimes|in:low,medium,high',
            'deadline' => 'required|date',
            'status' => 'sometimes|in:pending,in_progress,completed',
            'progress' => 'sometimes|integer|min:0|max:100',
            'attachment' => 'nullable|string|max:255',
        ]);

        $task = $this->taskService->createTask($data);
        return response()->json($task, 201);
    }

    public function show($id)
    {
        return response()->json($this->taskService->getTaskById($id));
    }

    public function update(Request $request, $id)
    {
        $data = $request->validate([
            'project_id' => 'sometimes|exists:projects,id',
            'employee_id' => 'sometimes|exists:users,id',
            'task_title' => 'sometimes|string|max:150',
            'description' => 'nullable|string',
            'priority' => 'sometimes|in:low,medium,high',
            'deadline' => 'sometimes|date',
            'status' => 'sometimes|in:pending,in_progress,completed',
            'progress' => 'sometimes|integer|min:0|max:100',
            'attachment' => 'nullable|string|max:255',
        ]);

        $task = $this->taskService->updateTask($id, $data);
        return response()->json($task);
    }

    public function destroy($id)
    {
        $this->taskService->deleteTask($id);
        return response()->json(null, 204);
    }
}

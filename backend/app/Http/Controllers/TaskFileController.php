<?php

namespace App\Http\Controllers;

use App\Services\TaskFileService;
use Illuminate\Http\Request;

class TaskFileController extends Controller
{
    protected $taskFileService;

    public function __construct(TaskFileService $taskFileService)
    {
        $this->taskFileService = $taskFileService;
    }

    public function index()
    {
        return response()->json($this->taskFileService->getAllTaskFiles());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'task_id' => 'required|exists:tasks,id',
            'file_name' => 'required|string|max:255',
            'file_path' => 'required|string|max:255',
            'uploaded_by' => 'required|exists:users,id',
        ]);

        $taskFile = $this->taskFileService->createTaskFile($data);
        return response()->json($taskFile, 201);
    }

    public function upload(Request $request)
    {
        $request->validate([
            'task_id' => 'required|exists:tasks,id',
            'file' => 'required|file|max:10240', // 10MB max
            'uploaded_by' => 'required|exists:users,id',
        ]);

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $fileName = time() . '_' . $file->getClientOriginalName();
            $filePath = $file->storeAs('uploads/tasks', $fileName, 'public');

            $data = [
                'task_id' => $request->task_id,
                'file_name' => $file->getClientOriginalName(),
                'file_path' => $filePath,
                'uploaded_by' => $request->uploaded_by,
            ];

            $taskFile = $this->taskFileService->createTaskFile($data);
            return response()->json($taskFile, 201);
        }

        return response()->json(['message' => 'No file uploaded'], 400);
    }

    public function show($id)
    {
        return response()->json($this->taskFileService->getTaskFileById($id));
    }

    public function update(Request $request, $id)
    {
        $data = $request->validate([
            'task_id' => 'sometimes|exists:tasks,id',
            'file_name' => 'sometimes|string|max:255',
            'file_path' => 'sometimes|string|max:255',
            'uploaded_by' => 'sometimes|exists:users,id',
        ]);

        $taskFile = $this->taskFileService->updateTaskFile($id, $data);
        return response()->json($taskFile);
    }

    public function destroy($id)
    {
        $this->taskFileService->deleteTaskFile($id);
        return response()->json(null, 204);
    }
}

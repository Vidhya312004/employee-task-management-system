<?php

namespace App\Http\Controllers;

use App\Services\ProjectService;
use Illuminate\Http\Request;

class ProjectController extends Controller
{
    protected $projectService;

    public function __construct(ProjectService $projectService)
    {
        $this->projectService = $projectService;
    }

    public function index()
    {
        return response()->json($this->projectService->getAllProjects());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'project_name' => 'required|string|max:150',
            'description' => 'nullable|string',
            'start_date' => 'required|date',
            'end_date' => 'required|date',
            'status' => 'sometimes|in:pending,ongoing,completed',
            'created_by' => 'required|exists:users,id',
        ]);

        $project = $this->projectService->createProject($data);
        return response()->json($project, 201);
    }

    public function show($id)
    {
        return response()->json($this->projectService->getProjectById($id));
    }

    public function update(Request $request, $id)
    {
        $data = $request->validate([
            'project_name' => 'sometimes|string|max:150',
            'description' => 'nullable|string',
            'start_date' => 'sometimes|date',
            'end_date' => 'sometimes|date',
            'status' => 'sometimes|in:pending,ongoing,completed',
            'created_by' => 'sometimes|exists:users,id',
        ]);

        $project = $this->projectService->updateProject($id, $data);
        return response()->json($project);
    }

    public function destroy($id)
    {
        $this->projectService->deleteProject($id);
        return response()->json(null, 204);
    }
}

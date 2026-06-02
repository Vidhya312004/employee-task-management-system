<?php

namespace App\Http\Controllers;

use App\Services\CommentService;
use Illuminate\Http\Request;

class CommentController extends Controller
{
    protected $commentService;

    public function __construct(CommentService $commentService)
    {
        $this->commentService = $commentService;
    }

    public function index()
    {
        return response()->json($this->commentService->getAllComments());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'task_id' => 'required|exists:tasks,id',
            'user_id' => 'required|exists:users,id',
            'comment' => 'required|string',
        ]);

        $comment = $this->commentService->createComment($data);
        return response()->json($comment, 201);
    }

    public function show($id)
    {
        return response()->json($this->commentService->getCommentById($id));
    }

    public function update(Request $request, $id)
    {
        $data = $request->validate([
            'task_id' => 'sometimes|exists:tasks,id',
            'user_id' => 'sometimes|exists:users,id',
            'comment' => 'sometimes|string',
        ]);

        $comment = $this->commentService->updateComment($id, $data);
        return response()->json($comment);
    }

    public function destroy($id)
    {
        $this->commentService->deleteComment($id);
        return response()->json(null, 204);
    }
}

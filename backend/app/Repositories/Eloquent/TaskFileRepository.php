<?php

namespace App\Repositories\Eloquent;

use App\Models\TaskFile;
use App\Repositories\Contracts\TaskFileRepositoryInterface;

class TaskFileRepository implements TaskFileRepositoryInterface
{
    public function all()
    {
        return TaskFile::all();
    }

    public function find($id)
    {
        return TaskFile::findOrFail($id);
    }

    public function create(array $data)
    {
        return TaskFile::create($data);
    }

    public function update($id, array $data)
    {
        $taskFile = TaskFile::findOrFail($id);
        $taskFile->update($data);
        return $taskFile;
    }

    public function delete($id)
    {
        $taskFile = TaskFile::findOrFail($id);
        return $taskFile->delete();
    }
}

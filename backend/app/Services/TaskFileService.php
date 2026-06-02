<?php

namespace App\Services;

use App\Repositories\Contracts\TaskFileRepositoryInterface;

class TaskFileService
{
    protected $taskFileRepository;

    public function __construct(TaskFileRepositoryInterface $taskFileRepository)
    {
        $this->taskFileRepository = $taskFileRepository;
    }

    public function getAllTaskFiles()
    {
        return $this->taskFileRepository->all();
    }

    public function getTaskFileById($id)
    {
        return $this->taskFileRepository->find($id);
    }

    public function createTaskFile(array $data)
    {
        return $this->taskFileRepository->create($data);
    }

    public function updateTaskFile($id, array $data)
    {
        return $this->taskFileRepository->update($id, $data);
    }

    public function deleteTaskFile($id)
    {
        return $this->taskFileRepository->delete($id);
    }
}

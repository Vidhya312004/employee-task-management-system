<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Task extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id',
        'employee_id',
        'task_title',
        'description',
        'priority',
        'deadline',
        'status',
        'progress',
        'attachment',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function employee()
    {
        return $this->belongsTo(User::class, 'employee_id');
    }

    public function comments()
    {
        return $this->hasMany(Comment::class);
    }

    public function taskFiles()
    {
        return $this->hasMany(TaskFile::class);
    }
}
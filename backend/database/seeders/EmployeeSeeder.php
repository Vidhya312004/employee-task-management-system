<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class EmployeeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create a specific employee for testing
        User::create([
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'password' => Hash::make('password'),
            'role' => 'employee',
        ]);

        User::create([
            'name' => 'Jane Smith',
            'email' => 'smith@example.com',
            'password' => Hash::make('password'),
            'role' => 'employee',
        ]);

        // Generate 5 random employees
        User::factory(5)->create([
            'role' => 'employee',
        ]);
    }
}

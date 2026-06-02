<?php

namespace App\Http\Controllers;

use App\Services\UserService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class UserController extends Controller
{
    protected $userService;

    public function __construct(UserService $userService)
    {
        $this->userService = $userService;
    }

    public function index()
    {
        return response()->json($this->userService->getAllUsers());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:100',
            'email' => 'required|string|email|max:100|unique:users',
            'password' => 'required|string|min:6',
            'role' => 'required|in:admin,employee,developer,designer,tester,pm',
            'phone' => 'nullable|string|max:15',
            'department' => 'nullable|string|max:100',
            'profile_image' => 'nullable|string|max:255',
        ]);

        // Hash password before saving
        $data['password'] = bcrypt($data['password']);

        $user = $this->userService->createUser($data);
        return response()->json($user, 201);
    }

    public function show($id)
    {
        return response()->json($this->userService->getUserById($id));
    }

    public function update(Request $request, $id)
    {
        $data = $request->validate([
            'name' => 'sometimes|string|max:100',
            'email' => 'sometimes|string|email|max:100|unique:users,email,'.$id,
            'password' => 'sometimes|string|min:6',
            'role' => 'sometimes|in:admin,employee,developer,designer,tester,pm',
            'phone' => 'nullable|string|max:15',
            'department' => 'nullable|string|max:100',
            'profile_image' => 'nullable|string|max:255',
        ]);

        if (isset($data['password'])) {
            $data['password'] = bcrypt($data['password']);
        }

        $user = $this->userService->updateUser($id, $data);
        return response()->json($user);
    }

    public function destroy($id)
    {
        $this->userService->deleteUser($id);
        return response()->json(null, 204);
    }

    public function uploadProfileImage(Request $request, $id)
    {
        $request->validate([
            'profile_image' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        $user = $this->userService->getUserById($id);

        if ($request->hasFile('profile_image')) {
            if ($user->profile_image) {
                // Delete old image if it exists in storage (extract path relative to storage/app/public dynamically)
                $parsedUrl = parse_url($user->profile_image);
                $pathInUrl = $parsedUrl['path'] ?? '';
                $oldPath = str_replace('/storage/', '', $pathInUrl);
                Storage::disk('public')->delete($oldPath);
            }

            $path = $request->file('profile_image')->store('profile_images', 'public');
            
            // Build full URL dynamically using url() helper to include port
            $fullUrl = url('storage/' . $path);

            $updatedUser = $this->userService->updateUser($id, ['profile_image' => $fullUrl]);

            return response()->json($updatedUser);
        }

        return response()->json(['message' => 'No image provided'], 400);
    }

    public function removeProfileImage($id)
    {
        $user = $this->userService->getUserById($id);

        if ($user->profile_image) {
            // Delete image file from public disk
            $parsedUrl = parse_url($user->profile_image);
            $pathInUrl = $parsedUrl['path'] ?? '';
            $oldPath = str_replace('/storage/', '', $pathInUrl);
            Storage::disk('public')->delete($oldPath);
        }

        $updatedUser = $this->userService->updateUser($id, ['profile_image' => null]);

        return response()->json($updatedUser);
    }
}

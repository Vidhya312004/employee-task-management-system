<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);

$user = App\Models\User::first();
$token = $user->createToken('test')->plainTextToken;

$request = Illuminate\Http\Request::create(
    '/api/users',
    'POST',
    ['name' => 'Test User', 'email' => 'test89@example.com', 'password' => 'password123', 'role' => 'developer']
);
$request->headers->set('Accept', 'application/json');
$request->headers->set('Authorization', 'Bearer ' . $token);

$response = $kernel->handle($request);
echo "Status: " . $response->getStatusCode() . "\n";
echo "Content: " . $response->getContent() . "\n";

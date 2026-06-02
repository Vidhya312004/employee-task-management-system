<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$kernel->bootstrap();

use App\Models\User;

$user = User::where('email', 'admin@gmail.com')->first();
if ($user) {
    $user->role = 'admin';
    $user->save();
    echo "Successfully updated user admin@gmail.com to admin role!\n";
} else {
    echo "User admin@gmail.com not found.\n";
}

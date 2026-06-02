<?php
$start = microtime(true);
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$kernel->bootstrap();
$bootEnd = microtime(true);

$user = App\Models\User::where('email', 'admin@example.com')->first();
$token = $user->createToken('test')->plainTextToken;

$request = Illuminate\Http\Request::create(
    '/api/tasks',
    'GET'
);
$request->headers->set('Accept', 'application/json');
$request->headers->set('Authorization', 'Bearer ' . $token);

// Enable query log
\Illuminate\Support\Facades\DB::connection()->enableQueryLog();

$reqStart = microtime(true);
$response = $kernel->handle($request);
$reqEnd = microtime(true);

echo "Status: " . $response->getStatusCode() . "\n";
echo "Response Length: " . strlen($response->getContent()) . " bytes\n";
echo "Boot time: " . ($bootEnd - $start) . " seconds\n";
echo "Request time: " . ($reqEnd - $reqStart) . " seconds\n";
echo "Total time: " . ($reqEnd - $start) . " seconds\n";

echo "\nExecuted Queries:\n";
$queries = \Illuminate\Support\Facades\DB::connection()->getQueryLog();
print_r($queries);

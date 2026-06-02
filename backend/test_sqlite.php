<?php
try {
    $db = new PDO('sqlite:C:\demo\taskmanagement\tasks.db');
    $stmt = $db->query("SELECT name FROM sqlite_master WHERE type='table'");
    $tables = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "TABLES IN C:\\demo\\taskmanagement\\tasks.db:\n";
    print_r($tables);

    foreach ($tables as $t) {
        $name = $t['name'];
        if (in_array($name, ['sqlite_sequence'])) continue;
        $countStmt = $db->query("SELECT COUNT(*) FROM [$name]");
        $count = $countStmt ? $countStmt->fetchColumn() : 'N/A';
        echo "Table: $name, Count: $count\n";
        
        // Show a sample row
        $sampleStmt = $db->query("SELECT * FROM [$name] LIMIT 1");
        $sample = $sampleStmt ? $sampleStmt->fetch(PDO::FETCH_ASSOC) : null;
        if ($sample) {
            echo "Sample from $name: ";
            print_r($sample);
        }
        echo "\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}

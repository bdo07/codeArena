<?php

namespace App\Services;

use PDO;
use PDOException;
use Exception;

class SqlExecutionService
{
    /**
     * Disallowed SQLite keywords/commands for security isolation
     */
    protected array $blacklistedPatterns = [
        '/\bATTACH\b/i',
        '/\bDETACH\b/i',
        '/\bPRAGMA\b/i',
        '/\bLOAD_EXTENSION\b/i',
    ];

    /**
     * Execute an untrusted SQL query against an isolated in-memory SQLite database.
     *
     * @param string $schema DDL to set up tables
     * @param string $seed DML to insert initial records
     * @param string $userQuery The query written by the user
     * @param string|null $referenceQuery The official reference query (to compute expected result)
     * @return array
     */
    public function execute(string $schema, string $seed, string $userQuery, ?string $referenceQuery = null): array
    {
        $startTime = microtime(true);

        // Security check on user query
        foreach ($this->blacklistedPatterns as $pattern) {
            if (preg_match($pattern, $userQuery)) {
                return [
                    'success' => false,
                    'passed' => false,
                    'error' => 'Disallowed SQL statement or keyword detected.',
                    'user_result' => null,
                    'expected_result' => null,
                    'execution_time_ms' => 0,
                ];
            }
        }

        try {
            // 1. Create isolated in-memory database for user
            $userPdo = new PDO('sqlite::memory:');
            $userPdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $userPdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

            // Run schema and seed
            if (!empty(trim($schema))) {
                $userPdo->exec($schema);
            }
            if (!empty(trim($seed))) {
                $userPdo->exec($seed);
            }

            // Execute user query
            $stmt = $userPdo->prepare($userQuery);
            $stmt->execute();

            $userRows = $stmt->fetchAll();
            $columns = [];
            if (!empty($userRows)) {
                $columns = array_keys($userRows[0]);
            } elseif ($stmt->columnCount() > 0) {
                for ($i = 0; $i < $stmt->columnCount(); $i++) {
                    $meta = $stmt->getColumnMeta($i);
                    if ($meta && isset($meta['name'])) {
                        $columns[] = $meta['name'];
                    }
                }
            }

            $executionTimeMs = round((microtime(true) - $startTime) * 1000, 2);

            $userResult = [
                'columns' => $columns,
                'rows' => $userRows,
                'row_count' => count($userRows),
            ];

            // 2. If reference query provided, execute on a clean fresh in-memory database
            $expectedResult = null;
            $passed = false;

            if ($referenceQuery && !empty(trim($referenceQuery))) {
                $refPdo = new PDO('sqlite::memory:');
                $refPdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
                $refPdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

                if (!empty(trim($schema))) {
                    $refPdo->exec($schema);
                }
                if (!empty(trim($seed))) {
                    $refPdo->exec($seed);
                }

                $refStmt = $refPdo->prepare($referenceQuery);
                $refStmt->execute();
                $refRows = $refStmt->fetchAll();

                $refColumns = [];
                if (!empty($refRows)) {
                    $refColumns = array_keys($refRows[0]);
                } elseif ($refStmt->columnCount() > 0) {
                    for ($i = 0; $i < $refStmt->columnCount(); $i++) {
                        $meta = $refStmt->getColumnMeta($i);
                        if ($meta && isset($meta['name'])) {
                            $refColumns[] = $meta['name'];
                        }
                    }
                }

                $expectedResult = [
                    'columns' => $refColumns,
                    'rows' => $refRows,
                    'row_count' => count($refRows),
                ];

                // Compare results: compare JSON canonical representation
                $passed = $this->compareResults($userRows, $refRows, $columns, $refColumns);
            } else {
                // If no reference query, syntax check passed
                $passed = true;
            }

            return [
                'success' => true,
                'passed' => $passed,
                'error' => null,
                'user_result' => $userResult,
                'expected_result' => $expectedResult,
                'execution_time_ms' => $executionTimeMs,
            ];
        } catch (PDOException $e) {
            return [
                'success' => false,
                'passed' => false,
                'error' => 'SQL Error: ' . $e->getMessage(),
                'user_result' => null,
                'expected_result' => null,
                'execution_time_ms' => round((microtime(true) - $startTime) * 1000, 2),
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'passed' => false,
                'error' => 'Execution Error: ' . $e->getMessage(),
                'user_result' => null,
                'expected_result' => null,
                'execution_time_ms' => round((microtime(true) - $startTime) * 1000, 2),
            ];
        }
    }

    /**
     * Compare user query rows against reference query rows
     */
    protected function compareResults(array $userRows, array $refRows, array $userCols, array $refCols): bool
    {
        if (count($userRows) !== count($refRows)) {
            return false;
        }

        // Check if row structures match
        $canonicalUser = array_map(function ($row) {
            // Normalize values to strings or trim
            return array_map(function ($val) {
                return is_numeric($val) ? (string) +$val : (string) $val;
            }, array_values($row));
        }, $userRows);

        $canonicalRef = array_map(function ($row) {
            return array_map(function ($val) {
                return is_numeric($val) ? (string) +$val : (string) $val;
            }, array_values($row));
        }, $refRows);

        return $canonicalUser === $canonicalRef;
    }
}

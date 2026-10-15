<?php

namespace Database\Seeders;

use App\Models\Badge;
use App\Models\Challenge;
use App\Models\Submission;
use App\Models\Tag;
use App\Models\TestCase;
use App\Models\User;
use App\Models\UserChallengeProgress;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Create Badges
        $badges = [
            [
                'name' => 'First Solve',
                'slug' => 'first-solve',
                'description' => 'Successfully solved your first challenge on CodeArena',
                'icon' => 'Award',
                'rule_key' => 'first_solve',
            ],
            [
                'name' => 'Problem Solver',
                'slug' => 'problem-solver',
                'description' => 'Solved 3 or more challenges',
                'icon' => 'Zap',
                'rule_key' => 'solve_3',
            ],
            [
                'name' => 'Decathlon Coder',
                'slug' => 'decathlon-coder',
                'description' => 'Solved 5 or more challenges across multiple categories',
                'icon' => 'Trophy',
                'rule_key' => 'solve_5',
            ],
            [
                'name' => 'Apex Master',
                'slug' => 'apex-master',
                'description' => 'Conquered a Hard tier algorithmic challenge',
                'icon' => 'ShieldCheck',
                'rule_key' => 'hard_solve',
            ],
        ];

        $createdBadges = [];
        foreach ($badges as $badgeData) {
            $createdBadges[$badgeData['slug']] = Badge::create($badgeData);
        }

        // 2. Create Users
        $admin = User::create([
            'name' => 'CodeArena Admin',
            'username' => 'admin',
            'email' => 'admin@codearena.dev',
            'password' => Hash::make('Password123!'),
            'role' => 'admin',
            'xp' => 1250,
        ]);

        $usersData = [
            [
                'name' => 'Alex Chen',
                'username' => 'alexchen',
                'email' => 'alex@example.com',
                'password' => Hash::make('Password123!'),
                'role' => 'user',
                'xp' => 950,
            ],
            [
                'name' => 'Sarah Connor',
                'username' => 'sarah_c',
                'email' => 'sarah@example.com',
                'password' => Hash::make('Password123!'),
                'role' => 'user',
                'xp' => 650,
            ],
            [
                'name' => 'Elena Rostova',
                'username' => 'elena_r',
                'email' => 'elena@example.com',
                'password' => Hash::make('Password123!'),
                'role' => 'user',
                'xp' => 450,
            ],
            [
                'name' => 'David Miller',
                'username' => 'dmiller',
                'email' => 'david@example.com',
                'password' => Hash::make('Password123!'),
                'role' => 'user',
                'xp' => 200,
            ],
            [
                'name' => 'Maya Lin',
                'username' => 'mayalin',
                'email' => 'maya@example.com',
                'password' => Hash::make('Password123!'),
                'role' => 'user',
                'xp' => 100,
            ],
        ];

        $createdUsers = [];
        foreach ($usersData as $data) {
            $user = User::create($data);
            $createdUsers[$user->username] = $user;
            $user->badges()->attach($createdBadges['first-solve']->id, ['earned_at' => Carbon::now()->subDays(5)]);
        }

        $createdUsers['alexchen']->badges()->attach($createdBadges['problem-solver']->id, ['earned_at' => Carbon::now()->subDays(2)]);
        $createdUsers['alexchen']->badges()->attach($createdBadges['decathlon-coder']->id, ['earned_at' => Carbon::now()->subDays(1)]);

        // 3. Create Tags
        $tagNames = ['Array', 'String', 'Hash Table', 'Two Pointers', 'Stack', 'Dynamic Programming', 'Math'];
        $createdTags = [];
        foreach ($tagNames as $name) {
            $slug = strtolower(str_replace(' ', '-', $name));
            $createdTags[$slug] = Tag::create([
                'name' => $name,
                'slug' => $slug,
            ]);
        }

        // 4. Create Challenges
        $challengesData = [
            [
                'slug' => 'two-sum',
                'title' => 'Two Sum',
                'difficulty' => 'Easy',
                'description' => "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.",
                'input_description' => 'First line contains comma-separated numbers representing `nums`. Second line contains the integer `target`.',
                'output_description' => 'Return the two 0-based indices separated by a comma (e.g. `0,1`).',
                'constraints' => "• 2 <= nums.length <= 10^4\n• -10^9 <= nums[i] <= 10^9\n• -10^9 <= target <= 10^9\n• Only one valid answer exists.",
                'time_limit_ms' => 2000,
                'memory_limit_mb' => 128,
                'tags' => ['array', 'hash-table'],
                'starter_code' => [
                    'python' => "import sys

def two_sum(nums, target):
    # Write your solution here
    lookup = {}
    for i, num in enumerate(nums):
        diff = target - num
        if diff in lookup:
            return f\"{lookup[diff]},{i}\"
        lookup[num] = i
    return \"\"

if __name__ == '__main__':
    lines = sys.stdin.read().splitlines()
    if len(lines) >= 2:
        nums = list(map(int, lines[0].split(',')))
        target = int(lines[1])
        print(two_sum(nums, target))
",
                    'javascript' => "const fs = require('fs');

function twoSum(nums, target) {
    // Write your solution here
    const map = new Map();
    for (let i = 0; i < nums.length; i++) {
        const diff = target - nums[i];
        if (map.has(diff)) {
            return \${map.get(diff)} + ',' + i;
        }
        map.set(nums[i], i);
    }
    return '';
}

const input = fs.readFileSync(0, 'utf-8').trim().split('\\n');
if (input.length >= 2) {
    const nums = input[0].split(',').map(Number);
    const target = Number(input[1]);
    console.log(twoSum(nums, target));
}
",
                    'cpp' => "#include <iostream>
#include <vector>
#include <string>
#include <sstream>
#include <unordered_map>

using namespace std;

int main() {
    string line1, line2;
    if (getline(cin, line1) && getline(cin, line2)) {
        stringstream ss(line1);
        string item;
        vector<int> nums;
        while (getline(ss, item, ',')) {
            nums.push_back(stoi(item));
        }
        int target = stoi(line2);
        unordered_map<int, int> map;
        for (int i = 0; i < nums.size(); i++) {
            int complement = target - nums[i];
            if (map.count(complement)) {
                cout << map[complement] << \",\" << i << endl;
                return 0;
            }
            map[nums[i]] = i;
        }
    }
    return 0;
}
",
                ],
                'test_cases' => [
                    [
                        'input_data' => "2,7,11,15\n9",
                        'expected_output' => '0,1',
                        'is_sample' => true,
                        'points' => 20,
                    ],
                    [
                        'input_data' => "3,2,4\n6",
                        'expected_output' => '1,2',
                        'is_sample' => true,
                        'points' => 20,
                    ],
                    [
                        'input_data' => "3,3\n6",
                        'expected_output' => '0,1',
                        'is_sample' => false,
                        'points' => 20,
                    ],
                    [
                        'input_data' => "1,5,9,14,20\n23",
                        'expected_output' => '1,4',
                        'is_sample' => false,
                        'points' => 20,
                    ],
                    [
                        'input_data' => "-3,4,3,90\n0",
                        'expected_output' => '0,2',
                        'is_sample' => false,
                        'points' => 20,
                    ],
                ],
            ],
            [
                'slug' => 'valid-parentheses',
                'title' => 'Valid Parentheses',
                'difficulty' => 'Easy',
                'description' => "Given a string `s` containing just the characters `'('`, `')'`, `'{'`, `'}'`, `'['` and `']'`, determine if the input string is valid.\n\nAn input string is valid if:\n1. Open brackets must be closed by the same type of brackets.\n2. Open brackets must be closed in the correct order.\n3. Every close bracket has a corresponding open bracket of the same type.",
                'input_description' => 'A single line containing the string `s`.',
                'output_description' => 'Output `true` if valid, otherwise `false`.',
                'constraints' => "• 1 <= s.length <= 10^4\n• `s` consists of parentheses only `'()[]{}'`.",
                'time_limit_ms' => 2000,
                'memory_limit_mb' => 128,
                'tags' => ['string', 'stack'],
                'starter_code' => [
                    'python' => "import sys

def is_valid(s):
    # Write your solution here
    stack = []
    mapping = {')': '(', '}': '{', ']': '['}
    for char in s:
        if char in mapping:
            top = stack.pop() if stack else '#'
            if mapping[char] != top:
                return 'false'
        else:
            stack.append(char)
    return 'true' if not stack else 'false'

if __name__ == '__main__':
    s = sys.stdin.read().strip()
    print(is_valid(s))
",
                    'javascript' => "const fs = require('fs');

function isValid(s) {
    // Write your solution here
    const stack = [];
    const map = { ')': '(', '}': '{', ']': '[' };
    for (let char of s) {
        if (map[char]) {
            if (stack.pop() !== map[char]) return 'false';
        } else {
            stack.push(char);
        }
    }
    return stack.length === 0 ? 'true' : 'false';
}

const input = fs.readFileSync(0, 'utf-8').trim();
console.log(isValid(input));
",
                    'cpp' => "#include <iostream>
#include <string>
#include <stack>
#include <unordered_map>

using namespace std;

int main() {
    string s;
    if (cin >> s) {
        stack<char> st;
        unordered_map<char, char> m = {{')', '('}, {'}', '{'}, {']', '['}};
        for (char c : s) {
            if (m.count(c)) {
                if (st.empty() || st.top() != m[c]) {
                    cout << \"false\" << endl;
                    return 0;
                }
                st.pop();
            } else {
                st.push(c);
            }
        }
        cout << (st.empty() ? \"true\" : \"false\") << endl;
    }
    return 0;
}
",
                ],
                'test_cases' => [
                    [
                        'input_data' => '()',
                        'expected_output' => 'true',
                        'is_sample' => true,
                        'points' => 25,
                    ],
                    [
                        'input_data' => '()[]{}',
                        'expected_output' => 'true',
                        'is_sample' => true,
                        'points' => 25,
                    ],
                    [
                        'input_data' => '(]',
                        'expected_output' => 'false',
                        'is_sample' => false,
                        'points' => 25,
                    ],
                    [
                        'input_data' => '([)]',
                        'expected_output' => 'false',
                        'is_sample' => false,
                        'points' => 25,
                    ],
                ],
            ],
            [
                'slug' => 'longest-substring-without-repeating-characters',
                'title' => 'Longest Substring Without Repeating Characters',
                'difficulty' => 'Medium',
                'description' => 'Given a string `s`, find the length of the longest substring without duplicate characters.',
                'input_description' => 'A single line containing the string `s`.',
                'output_description' => 'An integer representing the length of the longest substring without repeating characters.',
                'constraints' => "• 0 <= s.length <= 5 * 10^4\n• `s` consists of English letters, digits, symbols and spaces.",
                'time_limit_ms' => 2000,
                'memory_limit_mb' => 128,
                'tags' => ['string', 'hash-table', 'two-pointers'],
                'starter_code' => [
                    'python' => "import sys

def length_of_longest_substring(s):
    # Write your solution here
    char_map = {}
    left = 0
    max_len = 0
    for right, char in enumerate(s):
        if char in char_map and char_map[char] >= left:
            left = char_map[char] + 1
        char_map[char] = right
        max_len = max(max_len, right - left + 1)
    return max_len

if __name__ == '__main__':
    s = sys.stdin.read().rstrip('\\r\\n')
    print(length_of_longest_substring(s))
",
                    'javascript' => "const fs = require('fs');

function lengthOfLongestSubstring(s) {
    // Write your solution here
    const map = new Map();
    let left = 0, maxLen = 0;
    for (let right = 0; right < s.length; right++) {
        if (map.has(s[right]) && map.get(s[right]) >= left) {
            left = map.get(s[right]) + 1;
        }
        map.set(s[right], right);
        maxLen = Math.max(maxLen, right - left + 1);
    }
    return maxLen;
}

const input = fs.readFileSync(0, 'utf-8').replace(/[\\r\\n]+$/, '');
console.log(lengthOfLongestSubstring(input));
",
                    'cpp' => '#include <iostream>
#include <string>
#include <unordered_map>
#include <algorithm>

using namespace std;

int main() {
    string s;
    getline(cin, s);
    unordered_map<char, int> m;
    int left = 0, max_len = 0;
    for (int right = 0; right < s.length(); right++) {
        if (m.count(s[right]) && m[s[right]] >= left) {
            left = m[s[right]] + 1;
        }
        m[s[right]] = right;
        max_len = max(max_len, right - left + 1);
    }
    cout << max_len << endl;
    return 0;
}
',
                ],
                'test_cases' => [
                    [
                        'input_data' => 'abcabcbb',
                        'expected_output' => '3',
                        'is_sample' => true,
                        'points' => 25,
                    ],
                    [
                        'input_data' => 'bbbbb',
                        'expected_output' => '1',
                        'is_sample' => true,
                        'points' => 25,
                    ],
                    [
                        'input_data' => 'pwwkew',
                        'expected_output' => '3',
                        'is_sample' => false,
                        'points' => 25,
                    ],
                    [
                        'input_data' => 'aab',
                        'expected_output' => '2',
                        'is_sample' => false,
                        'points' => 25,
                    ],
                ],
            ],
            [
                'slug' => 'container-with-most-water',
                'title' => 'Container With Most Water',
                'difficulty' => 'Medium',
                'description' => "You are given an integer array `height` of length `n`. There are `n` vertical lines drawn such that the two endpoints of the `i`th line are `(i, 0)` and `(i, height[i])`.\n\nFind two lines that together with the x-axis form a container, such that the container contains the most water.\n\nReturn the maximum amount of water a container can store.",
                'input_description' => 'A single line containing comma-separated integers representing bar heights.',
                'output_description' => 'An integer representing the maximum water area.',
                'constraints' => "• n == height.length\n• 2 <= n <= 10^5\n• 0 <= height[i] <= 10^4",
                'time_limit_ms' => 2000,
                'memory_limit_mb' => 128,
                'tags' => ['array', 'two-pointers'],
                'starter_code' => [
                    'python' => "import sys

def max_area(height):
    left = 0
    right = len(height) - 1
    max_water = 0
    while left < right:
        h = min(height[left], height[right])
        max_water = max(max_water, h * (right - left))
        if height[left] < height[right]:
            left += 1
        else:
            right -= 1
    return max_water

if __name__ == '__main__':
    line = sys.stdin.read().strip()
    if line:
        height = list(map(int, line.split(',')))
        print(max_area(height))
",
                    'javascript' => "const fs = require('fs');

function maxArea(height) {
    let left = 0, right = height.length - 1, maxWater = 0;
    while (left < right) {
        const h = Math.min(height[left], height[right]);
        maxWater = Math.max(maxWater, h * (right - left));
        if (height[left] < height[right]) left++;
        else right--;
    }
    return maxWater;
}

const input = fs.readFileSync(0, 'utf-8').trim();
if (input) {
    const height = input.split(',').map(Number);
    console.log(maxArea(height));
}
",
                    'cpp' => "#include <iostream>
#include <vector>
#include <string>
#include <sstream>
#include <algorithm>

using namespace std;

int main() {
    string line;
    if (cin >> line) {
        stringstream ss(line);
        string item;
        vector<int> h;
        while (getline(ss, item, ',')) {
            h.push_back(stoi(item));
        }
        int left = 0, right = h.size() - 1, max_w = 0;
        while (left < right) {
            int current_h = min(h[left], h[right]);
            max_w = max(max_w, current_h * (right - left));
            if (h[left] < h[right]) left++;
            else right--;
        }
        cout << max_w << endl;
    }
    return 0;
}
",
                ],
                'test_cases' => [
                    [
                        'input_data' => '1,8,6,2,5,4,8,3,7',
                        'expected_output' => '49',
                        'is_sample' => true,
                        'points' => 30,
                    ],
                    [
                        'input_data' => '1,1',
                        'expected_output' => '1',
                        'is_sample' => true,
                        'points' => 30,
                    ],
                    [
                        'input_data' => '4,3,2,1,4',
                        'expected_output' => '16',
                        'is_sample' => false,
                        'points' => 40,
                    ],
                ],
            ],
            [
                'slug' => 'trapping-rain-water',
                'title' => 'Trapping Rain Water',
                'difficulty' => 'Hard',
                'description' => 'Given `n` non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.',
                'input_description' => 'A single line containing comma-separated integers representing elevations.',
                'output_description' => 'Total units of trapped rainwater as an integer.',
                'constraints' => "• n == height.length\n• 1 <= n <= 2 * 10^4\n• 0 <= height[i] <= 10^5",
                'time_limit_ms' => 2000,
                'memory_limit_mb' => 128,
                'tags' => ['array', 'two-pointers', 'dynamic-programming', 'stack'],
                'starter_code' => [
                    'python' => "import sys

def trap(height):
    if not height:
        return 0
    left, right = 0, len(height) - 1
    left_max, right_max = height[left], height[right]
    water = 0
    while left < right:
        if left_max < right_max:
            left += 1
            left_max = max(left_max, height[left])
            water += left_max - height[left]
        else:
            right -= 1
            right_max = max(right_max, height[right])
            water += right_max - height[right]
    return water

if __name__ == '__main__':
    line = sys.stdin.read().strip()
    if line:
        height = list(map(int, line.split(',')))
        print(trap(height))
",
                    'javascript' => "const fs = require('fs');

function trap(height) {
    if (!height.length) return 0;
    let left = 0, right = height.length - 1;
    let leftMax = height[left], rightMax = height[right];
    let water = 0;
    while (left < right) {
        if (leftMax < rightMax) {
            left++;
            leftMax = Math.max(leftMax, height[left]);
            water += leftMax - height[left];
        } else {
            right--;
            rightMax = Math.max(rightMax, height[right]);
            water += rightMax - height[right];
        }
    }
    return water;
}

const input = fs.readFileSync(0, 'utf-8').trim();
if (input) {
    const height = input.split(',').map(Number);
    console.log(trap(height));
}
",
                    'cpp' => "#include <iostream>
#include <vector>
#include <string>
#include <sstream>
#include <algorithm>

using namespace std;

int main() {
    string line;
    if (cin >> line) {
        stringstream ss(line);
        string item;
        vector<int> h;
        while (getline(ss, item, ',')) {
            h.push_back(stoi(item));
        }
        if (h.empty()) {
            cout << 0 << endl;
            return 0;
        }
        int left = 0, right = h.size() - 1;
        int left_max = h[left], right_max = h[right];
        int water = 0;
        while (left < right) {
            if (left_max < right_max) {
                left++;
                left_max = max(left_max, h[left]);
                water += left_max - h[left];
            } else {
                right--;
                right_max = max(right_max, h[right]);
                water += right_max - h[right];
            }
        }
        cout << water << endl;
    }
    return 0;
}
",
                ],
                'test_cases' => [
                    [
                        'input_data' => '0,1,0,2,1,0,1,3,2,1,2,1',
                        'expected_output' => '6',
                        'is_sample' => true,
                        'points' => 50,
                    ],
                    [
                        'input_data' => '4,2,0,3,2,5',
                        'expected_output' => '9',
                        'is_sample' => true,
                        'points' => 50,
                    ],
                ],
            ],
        ];

        foreach ($challengesData as $data) {
            $tags = $data['tags'];
            $testCases = $data['test_cases'];
            unset($data['tags'], $data['test_cases']);

            $data['created_by'] = $admin->id;
            $challenge = Challenge::create($data);

            // Attach tags
            $tagIds = [];
            foreach ($tags as $tagSlug) {
                if (isset($createdTags[$tagSlug])) {
                    $tagIds[] = $createdTags[$tagSlug]->id;
                }
            }
            $challenge->tags()->sync($tagIds);

            // Create test cases
            foreach ($testCases as $index => $tc) {
                $tc['challenge_id'] = $challenge->id;
                $tc['position'] = $index + 1;
                TestCase::create($tc);
            }
        }

        // 5. Seed some initial user submissions and progress for realistic leaderboards
        $twoSum = Challenge::where('slug', 'two-sum')->first();
        if ($twoSum) {
            $sub = Submission::create([
                'user_id' => $createdUsers['alexchen']->id,
                'challenge_id' => $twoSum->id,
                'language' => 'python',
                'source_code' => $twoSum->starter_code['python'],
                'status' => Submission::STATUS_ACCEPTED,
                'score' => 100,
                'execution_time_ms' => 45,
                'memory_kb' => 8420,
                'submitted_at' => Carbon::now()->subDays(2),
                'finished_at' => Carbon::now()->subDays(2),
            ]);

            UserChallengeProgress::create([
                'user_id' => $createdUsers['alexchen']->id,
                'challenge_id' => $twoSum->id,
                'best_score' => 100,
                'attempts_count' => 1,
                'solved_at' => Carbon::now()->subDays(2),
            ]);
        }
    }
}

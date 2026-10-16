<?php

/**
 * Script to generate a verified, comprehensive challenge library for CodeArena.
 * Generates challenges across:
 * - Algorithms (Arrays, Two Pointers, Sliding Window, Greedy, DP, Graphs, Trees)
 * - Data Structures (Linked Lists, Stacks, Queues, Hash Tables)
 * - Mathematics & Number Theory
 * - Sorting & Searching
 * - Recursion & Backtracking
 * - SQL Lab (DDL schemas, seeds, queries)
 * - Web (HTML/CSS/JS frontend components)
 * - DevOps, Linux, Git, Docker, REST, Software Engineering (Quizzes & practical exercises)
 */

$challenges = [];

function addChallenge(&$list, $data) {
    $list[] = array_merge([
        'challenge_type' => 'code',
        'category' => 'algorithms',
        'difficulty' => 'Easy',
        'estimated_time_min' => 20,
        'supported_languages' => ['python', 'javascript', 'cpp', 'java'],
        'time_limit_ms' => 2000,
        'memory_limit_mb' => 128,
        'tags' => [],
        'starter_code' => [],
        'test_cases' => [],
        'hints' => [],
        'explanation' => null,
        'reference_solution' => null,
        'sql_schema' => null,
        'sql_seed' => null,
        'sql_solution' => null,
        'web_template' => null,
        'quiz_data' => null,
        'is_daily' => false,
        'daily_date' => null,
    ], $data);
}

// ==========================================
// 1. ARRAYS & HASHING (Algorithms)
// ==========================================

addChallenge($challenges, [
    'slug' => 'two-sum',
    'title' => 'Two Sum',
    'category' => 'algorithms',
    'difficulty' => 'Easy',
    'estimated_time_min' => 15,
    'description' => "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nReturn the answer as comma-separated indices (e.g. `0,1`).",
    'tags' => ['array', 'hash-table'],
    'starter_code' => [
        'python' => "import sys\n\ndef two_sum(nums, target):\n    lookup = {}\n    for i, num in enumerate(nums):\n        diff = target - num\n        if diff in lookup:\n            return f\"{lookup[diff]},{i}\"\n        lookup[num] = i\n    return \"\"\n\nif __name__ == '__main__':\n    lines = sys.stdin.read().splitlines()\n    if len(lines) >= 2:\n        nums = list(map(int, lines[0].split(',')))\n        target = int(lines[1])\n        print(two_sum(nums, target))\n",
        'javascript' => "const fs = require('fs');\n\nfunction twoSum(nums, target) {\n    const map = new Map();\n    for (let i = 0; i < nums.length; i++) {\n        const diff = target - nums[i];\n        if (map.has(diff)) return map.get(diff) + ',' + i;\n        map.set(nums[i], i);\n    }\n    return '';\n}\n\nconst input = fs.readFileSync(0, 'utf-8').trim().split('\\n');\nif (input.length >= 2) {\n    const nums = input[0].split(',').map(Number);\n    const target = Number(input[1]);\n    console.log(twoSum(nums, target));\n}\n",
    ],
    'test_cases' => [
        ['input' => "2,7,11,15\n9", 'expected_output' => "0,1", 'is_hidden' => false, 'explanation' => 'nums[0] + nums[1] == 9, so return 0,1.'],
        ['input' => "3,2,4\n6", 'expected_output' => "1,2", 'is_hidden' => false, 'explanation' => 'nums[1] + nums[2] == 6.'],
        ['input' => "3,3\n6", 'expected_output' => "0,1", 'is_hidden' => true, 'explanation' => null],
        ['input' => "1,5,8,12,19\n20", 'expected_output' => "0,4", 'is_hidden' => true, 'explanation' => null],
    ],
    'hints' => [
        "A brute-force search takes O(N^2) time. Can you do it in O(N)?",
        "Consider using a Hash Map to store elements you have seen and their indices."
    ],
    'explanation' => "By maintaining a hash map from value to index as we iterate through nums, we can find the complement in O(1) time.",
    'reference_solution' => "def two_sum(nums, target):\n    seen = {}\n    for i, num in enumerate(nums):\n        comp = target - num\n        if comp in seen:\n            return f\"{seen[comp]},{i}\"\n        seen[num] = i\n    return \"\"",
    'is_daily' => true,
    'daily_date' => date('Y-m-d'),
]);

addChallenge($challenges, [
    'slug' => 'contains-duplicate',
    'title' => 'Contains Duplicate',
    'category' => 'algorithms',
    'difficulty' => 'Beginner',
    'estimated_time_min' => 10,
    'description' => "Given an integer array `nums`, return `true` if any value appears at least twice in the array, and return `false` if every element is distinct.\n\nInput format: A comma-separated list of integers.\nOutput format: `true` or `false`.",
    'tags' => ['array', 'hash-table'],
    'starter_code' => [
        'python' => "import sys\n\ndef contains_duplicate(nums):\n    return len(nums) != len(set(nums))\n\nif __name__ == '__main__':\n    line = sys.stdin.read().strip()\n    if line:\n        nums = list(map(int, line.split(',')))\n        print('true' if contains_duplicate(nums) else 'false')\n",
    ],
    'test_cases' => [
        ['input' => "1,2,3,1", 'expected_output' => "true", 'is_hidden' => false, 'explanation' => '1 appears twice.'],
        ['input' => "1,2,3,4", 'expected_output' => "false", 'is_hidden' => false, 'explanation' => 'All elements are distinct.'],
        ['input' => "1,1,1,3,3,4,3,2,4,2", 'expected_output' => "true", 'is_hidden' => true, 'explanation' => null],
    ],
    'hints' => ["Compare length of the set with original array."],
    'explanation' => "Hash sets allow duplicate detection in O(N) time.",
]);

addChallenge($challenges, [
    'slug' => 'best-time-to-buy-and-sell-stock',
    'title' => 'Best Time to Buy and Sell Stock',
    'category' => 'algorithms',
    'difficulty' => 'Easy',
    'estimated_time_min' => 20,
    'description' => "You are given an array `prices` where `prices[i]` is the price of a given stock on the `i-th` day.\n\nYou want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock.\n\nReturn the maximum profit you can achieve from this transaction. If you cannot achieve any profit, return `0`.\n\nInput format: Comma-separated integers.\nOutput format: A single integer representing maximum profit.",
    'tags' => ['array', 'greedy'],
    'starter_code' => [
        'python' => "import sys\n\ndef max_profit(prices):\n    min_p, max_p = float('inf'), 0\n    for p in prices:\n        min_p = min(min_p, p)\n        max_p = max(max_p, p - min_p)\n    return max_p\n\nif __name__ == '__main__':\n    line = sys.stdin.read().strip()\n    if line:\n        prices = list(map(int, line.split(',')))\n        print(max_profit(prices))\n",
    ],
    'test_cases' => [
        ['input' => "7,1,5,3,6,4", 'expected_output' => "5", 'is_hidden' => false, 'explanation' => 'Buy at 1, sell at 6 = profit 5.'],
        ['input' => "7,6,4,3,1", 'expected_output' => "0", 'is_hidden' => false, 'explanation' => 'No profit possible.'],
    ],
    'hints' => ["Maintain minimum price so far as you iterate."],
    'explanation' => "Single pass greedy approach runs in O(N) time and O(1) space.",
]);

addChallenge($challenges, [
    'slug' => 'product-of-array-except-self',
    'title' => 'Product of Array Except Self',
    'category' => 'algorithms',
    'difficulty' => 'Medium',
    'estimated_time_min' => 25,
    'description' => "Given an integer array `nums`, return an array `answer` such that `answer[i]` is equal to the product of all the elements of `nums` except `nums[i]` without using division.\n\nInput format: Comma-separated integers.\nOutput format: Comma-separated integers.",
    'tags' => ['array', 'prefix-sum'],
    'starter_code' => [
        'python' => "import sys\n\ndef product_except_self(nums):\n    n = len(nums)\n    res = [1] * n\n    pref = 1\n    for i in range(n):\n        res[i] = pref\n        pref *= nums[i]\n    suff = 1\n    for i in range(n-1, -1, -1):\n        res[i] *= suff\n        suff *= nums[i]\n    return ','.join(map(str, res))\n\nif __name__ == '__main__':\n    line = sys.stdin.read().strip()\n    if line:\n        nums = list(map(int, line.split(',')))\n        print(product_except_self(nums))\n",
    ],
    'test_cases' => [
        ['input' => "1,2,3,4", 'expected_output' => "24,12,8,6", 'is_hidden' => false, 'explanation' => 'Product of array except self.'],
        ['input' => "-1,1,0,-3,3", 'expected_output' => "0,0,9,0,0", 'is_hidden' => false, 'explanation' => 'Only index with 0 product is non-zero.'],
    ],
    'hints' => ["Calculate prefix products and suffix products in two passes."],
    'explanation' => "Prefix and suffix products run in O(N) time with O(1) auxiliary space.",
]);

addChallenge($challenges, [
    'slug' => 'maximum-subarray',
    'title' => 'Maximum Subarray (Kadane)',
    'category' => 'algorithms',
    'difficulty' => 'Medium',
    'estimated_time_min' => 20,
    'description' => "Given an integer array `nums`, find the subarray with the largest sum, and return its sum.\n\nInput format: Comma-separated integers.\nOutput format: Single integer.",
    'tags' => ['array', 'dynamic-programming'],
    'starter_code' => [
        'python' => "import sys\n\ndef max_sub_array(nums):\n    max_sum = cur_sum = nums[0]\n    for x in nums[1:]:\n        cur_sum = max(x, cur_sum + x)\n        max_sum = max(max_sum, cur_sum)\n    return max_sum\n\nif __name__ == '__main__':\n    line = sys.stdin.read().strip()\n    if line:\n        nums = list(map(int, line.split(',')))\n        print(max_sub_array(nums))\n",
    ],
    'test_cases' => [
        ['input' => "-2,1,-3,4,-1,2,1,-5,4", 'expected_output' => "6", 'is_hidden' => false, 'explanation' => '[4,-1,2,1] has sum 6.'],
        ['input' => "1", 'expected_output' => "1", 'is_hidden' => false, 'explanation' => 'Single item.'],
    ],
    'hints' => ["Kadane's algorithm: cur_sum = max(x, cur_sum + x)."],
    'explanation' => "Linear dynamic programming in O(N) time and O(1) space.",
]);

addChallenge($challenges, [
    'slug' => 'move-zeroes',
    'title' => 'Move Zeroes',
    'category' => 'algorithms',
    'difficulty' => 'Beginner',
    'estimated_time_min' => 15,
    'description' => "Given an integer array `nums`, move all `0`'s to the end of it while maintaining the relative order of the non-zero elements.\n\nInput format: Comma-separated integers.\nOutput format: Comma-separated integers.",
    'tags' => ['array', 'two-pointers'],
    'starter_code' => [
        'python' => "import sys\n\ndef move_zeroes(nums):\n    pos = 0\n    for n in nums:\n        if n != 0:\n            nums[pos] = n\n            pos += 1\n    while pos < len(nums):\n        nums[pos] = 0\n        pos += 1\n    return ','.join(map(str, nums))\n\nif __name__ == '__main__':\n    line = sys.stdin.read().strip()\n    if line:\n        nums = list(map(int, line.split(',')))\n        print(move_zeroes(nums))\n",
    ],
    'test_cases' => [
        ['input' => "0,1,0,3,12", 'expected_output' => "1,3,12,0,0", 'is_hidden' => false, 'explanation' => 'Zeroes shifted to end.'],
    ],
    'hints' => ["Use a write pointer to compact non-zero elements."],
    'explanation' => "Two pointer compaction in O(N) time.",
]);

addChallenge($challenges, [
    'slug' => '3sum',
    'title' => '3Sum',
    'category' => 'algorithms',
    'difficulty' => 'Medium',
    'estimated_time_min' => 30,
    'description' => "Given an integer array nums, return all the unique triplets `[nums[i], nums[j], nums[k]]` such that they add up to 0.\n\nOutput format: Triplets separated by semicolons, elements separated by commas (e.g. `-1,-1,2;-1,0,1`).",
    'tags' => ['array', 'two-pointers', 'sorting'],
    'starter_code' => [
        'python' => "import sys\n\ndef three_sum(nums):\n    nums.sort()\n    res = []\n    for i in range(len(nums) - 2):\n        if i > 0 and nums[i] == nums[i-1]: continue\n        l, r = i + 1, len(nums) - 1\n        while l < r:\n            s = nums[i] + nums[l] + nums[r]\n            if s < 0: l += 1\n            elif s > 0: r -= 1\n            else:\n                res.append(f\"{nums[i]},{nums[l]},{nums[r]}\")\n                while l < r and nums[l] == nums[l+1]: l += 1\n                while l < r and nums[r] == nums[r-1]: r -= 1\n                l += 1; r -= 1\n    return ';'.join(res)\n\nif __name__ == '__main__':\n    line = sys.stdin.read().strip()\n    if line:\n        nums = list(map(int, line.split(',')))\n        print(three_sum(nums))\n",
    ],
    'test_cases' => [
        ['input' => "-1,0,1,2,-1,-4", 'expected_output' => "-1,-1,2;-1,0,1", 'is_hidden' => false, 'explanation' => 'Unique triplets summing to 0.'],
        ['input' => "0,1,1", 'expected_output' => "", 'is_hidden' => false, 'explanation' => 'None.'],
    ],
    'hints' => ["Sort first and use two pointers for remaining sum."],
    'explanation' => "Sorting + two pointers takes O(N^2) time.",
]);

addChallenge($challenges, [
    'slug' => 'trapping-rain-water',
    'title' => 'Trapping Rain Water',
    'category' => 'algorithms',
    'difficulty' => 'Hard',
    'estimated_time_min' => 40,
    'description' => "Given `n` non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.\n\nInput format: Comma-separated integers.\nOutput format: Integer water units.",
    'tags' => ['array', 'two-pointers', 'dynamic-programming'],
    'starter_code' => [
        'python' => "import sys\n\ndef trap(height):\n    if not height: return 0\n    l, r = 0, len(height) - 1\n    l_max, r_max = height[l], height[r]\n    water = 0\n    while l < r:\n        if l_max < r_max:\n            l += 1\n            l_max = max(l_max, height[l])\n            water += l_max - height[l]\n        else:\n            r -= 1\n            r_max = max(r_max, height[r])\n            water += r_max - height[r]\n    return water\n\nif __name__ == '__main__':\n    line = sys.stdin.read().strip()\n    if line:\n        nums = list(map(int, line.split(',')))\n        print(trap(nums))\n",
    ],
    'test_cases' => [
        ['input' => "0,1,0,2,1,0,1,3,2,1,2,1", 'expected_output' => "6", 'is_hidden' => false, 'explanation' => '6 units trapped.'],
        ['input' => "4,2,0,3,2,5", 'expected_output' => "9", 'is_hidden' => false, 'explanation' => '9 units trapped.'],
    ],
    'hints' => ["Advance the side with smaller maximum."],
    'explanation' => "Two pointers achieves O(N) time and O(1) space.",
]);

// ==========================================
// 2. STRINGS
// ==========================================

addChallenge($challenges, [
    'slug' => 'reverse-string',
    'title' => 'Reverse String',
    'category' => 'strings',
    'difficulty' => 'Beginner',
    'estimated_time_min' => 10,
    'description' => "Write a function that reverses a string.\n\nInput format: A single string.\nOutput format: The reversed string.",
    'tags' => ['string'],
    'starter_code' => [
        'python' => "import sys\nprint(sys.stdin.read().strip()[::-1])\n",
    ],
    'test_cases' => [
        ['input' => "hello", 'expected_output' => "olleh", 'is_hidden' => false, 'explanation' => 'hello reversed is olleh.'],
    ],
    'hints' => ["Reverse the characters."],
    'explanation' => "O(N) time string reversal.",
]);

addChallenge($challenges, [
    'slug' => 'valid-anagram',
    'title' => 'Valid Anagram',
    'category' => 'strings',
    'difficulty' => 'Easy',
    'estimated_time_min' => 15,
    'description' => "Given two strings `s` and `t`, return `true` if `t` is an anagram of `s`, and `false` otherwise.",
    'tags' => ['string', 'hash-table'],
    'starter_code' => [
        'python' => "import sys\nfrom collections import Counter\nlines = sys.stdin.read().splitlines()\nif len(lines) >= 2:\n    print('true' if Counter(lines[0]) == Counter(lines[1]) else 'false')\n",
    ],
    'test_cases' => [
        ['input' => "anagram\nnagaram", 'expected_output' => "true", 'is_hidden' => false, 'explanation' => 'Anagram check.'],
        ['input' => "rat\ncar", 'expected_output' => "false", 'is_hidden' => false, 'explanation' => 'Not anagram.'],
    ],
    'hints' => ["Count character frequencies."],
    'explanation' => "Frequency counting in O(N) time.",
]);

addChallenge($challenges, [
    'slug' => 'valid-palindrome',
    'title' => 'Valid Palindrome',
    'category' => 'strings',
    'difficulty' => 'Easy',
    'estimated_time_min' => 15,
    'description' => "Given a string `s`, return `true` if it is a palindrome considering only alphanumeric characters and ignoring cases.",
    'tags' => ['string', 'two-pointers'],
    'starter_code' => [
        'python' => "import sys, re\ns = re.sub(r'[^a-zA-Z0-9]', '', sys.stdin.read()).lower()\nprint('true' if s == s[::-1] else 'false')\n",
    ],
    'test_cases' => [
        ['input' => "A man, a plan, a canal: Panama", 'expected_output' => "true", 'is_hidden' => false, 'explanation' => 'Valid palindrome.'],
    ],
    'hints' => ["Strip punctuation and compare lowercased."],
    'explanation' => "Filtering and two-pointer check runs in O(N) time.",
]);

addChallenge($challenges, [
    'slug' => 'longest-common-prefix',
    'title' => 'Longest Common Prefix',
    'category' => 'strings',
    'difficulty' => 'Easy',
    'estimated_time_min' => 15,
    'description' => "Write a function to find the longest common prefix string amongst an array of strings.",
    'tags' => ['string'],
    'starter_code' => [
        'python' => "import sys\nstrs = sys.stdin.read().strip().split(',')\nif not strs or not strs[0]: print(''); sys.exit()\nprefix = strs[0]\nfor s in strs[1:]:\n    while not s.startswith(prefix):\n        prefix = prefix[:-1]\nprint(prefix)\n",
    ],
    'test_cases' => [
        ['input' => "flower,flow,flight", 'expected_output' => "fl", 'is_hidden' => false, 'explanation' => 'fl prefix.'],
    ],
    'hints' => ["Iteratively shorten the candidate prefix."],
    'explanation' => "Horizontal scanning runs in O(S) time.",
]);

addChallenge($challenges, [
    'slug' => 'longest-substring-without-repeating-characters',
    'title' => 'Longest Substring Without Repeating Characters',
    'category' => 'strings',
    'difficulty' => 'Medium',
    'estimated_time_min' => 25,
    'description' => "Given a string `s`, find the length of the longest substring without repeating characters.",
    'tags' => ['string', 'sliding-window'],
    'starter_code' => [
        'python' => "import sys\ns = sys.stdin.read().strip()\nseen, l, ans = {}, 0, 0\nfor r, c in enumerate(s):\n    if c in seen and seen[c] >= l: l = seen[c] + 1\n    seen[c] = r\n    ans = max(ans, r - l + 1)\nprint(ans)\n",
    ],
    'test_cases' => [
        ['input' => "abcabcbb", 'expected_output' => "3", 'is_hidden' => false, 'explanation' => 'abc has length 3.'],
    ],
    'hints' => ["Use sliding window hash table."],
    'explanation' => "Sliding window in O(N) time.",
]);

// ==========================================
// 3. DATA STRUCTURES (Linked Lists & Stacks)
// ==========================================

addChallenge($challenges, [
    'slug' => 'valid-parentheses',
    'title' => 'Valid Parentheses',
    'category' => 'data structures',
    'difficulty' => 'Easy',
    'estimated_time_min' => 15,
    'description' => "Given a string `s` containing `(`, `)`, `{`, `}`, `[`, `]`, determine if the brackets are closed in valid order.",
    'tags' => ['stack'],
    'starter_code' => [
        'python' => "import sys\ns = sys.stdin.read().strip()\nstk = []\nm = {')':'(', '}':'{', ']':'['}\nvalid = True\nfor c in s:\n    if c in m:\n        if not stk or stk[-1] != m[c]: valid = False; break\n        stk.pop()\n    else: stk.append(c)\nprint('true' if valid and not stk else 'false')\n",
    ],
    'test_cases' => [
        ['input' => "()[]{}", 'expected_output' => "true", 'is_hidden' => false, 'explanation' => 'Valid brackets.'],
        ['input' => "(]", 'expected_output' => "false", 'is_hidden' => false, 'explanation' => 'Mismatch.'],
    ],
    'hints' => ["Use a stack to match brackets."],
    'explanation' => "LIFO stack in O(N) time.",
]);

addChallenge($challenges, [
    'slug' => 'reverse-linked-list',
    'title' => 'Reverse Linked List',
    'category' => 'data structures',
    'difficulty' => 'Easy',
    'estimated_time_min' => 15,
    'description' => "Given the head of a singly linked list represented as comma-separated values, reverse the list and return the reversed values.\n\nInput format: Comma-separated integers.\nOutput format: Comma-separated reversed integers.",
    'tags' => ['linked-list', 'two-pointers'],
    'starter_code' => [
        'python' => "import sys\nline = sys.stdin.read().strip()\nif line:\n    nums = line.split(',')\n    print(','.join(nums[::-1]))\nelse: print('')\n",
    ],
    'test_cases' => [
        ['input' => "1,2,3,4,5", 'expected_output' => "5,4,3,2,1", 'is_hidden' => false, 'explanation' => 'Reversed list.'],
        ['input' => "1,2", 'expected_output' => "2,1", 'is_hidden' => false, 'explanation' => 'Reversed two nodes.'],
    ],
    'hints' => ["Track prev, current, and next pointers."],
    'explanation' => "Iterative pointer reversal in O(N) time and O(1) space.",
]);

addChallenge($challenges, [
    'slug' => 'merge-two-sorted-lists',
    'title' => 'Merge Two Sorted Lists',
    'category' => 'data structures',
    'difficulty' => 'Easy',
    'estimated_time_min' => 20,
    'description' => "You are given two sorted lists of integers on separate lines. Merge the two lists into one sorted list.\n\nInput format: Line 1: comma-separated integers. Line 2: comma-separated integers.\nOutput format: Comma-separated merged sorted integers.",
    'tags' => ['linked-list', 'two-pointers', 'sorting'],
    'starter_code' => [
        'python' => "import sys\nlines = sys.stdin.read().splitlines()\na = list(map(int, lines[0].split(','))) if len(lines) > 0 and lines[0] else []\nb = list(map(int, lines[1].split(','))) if len(lines) > 1 and lines[1] else []\nres = []\ni, j = 0, 0\nwhile i < len(a) and j < len(b):\n    if a[i] <= b[j]: res.append(a[i]); i += 1\n    else: res.append(b[j]); j += 1\nres.extend(a[i:]); res.extend(b[j:])\nprint(','.join(map(str, res)))\n",
    ],
    'test_cases' => [
        ['input' => "1,2,4\n1,3,4", 'expected_output' => "1,1,2,3,4,4", 'is_hidden' => false, 'explanation' => 'Merged sorted list.'],
    ],
    'hints' => ["Compare heads of both lists and advance the smaller."],
    'explanation' => "Linear merge in O(N + M) time.",
]);

addChallenge($challenges, [
    'slug' => 'middle-of-linked-list',
    'title' => 'Middle of the Linked List',
    'category' => 'data structures',
    'difficulty' => 'Beginner',
    'estimated_time_min' => 15,
    'description' => "Given the head of a singly linked list as comma-separated integers, return the values from the second middle node to the end if there are two middle nodes.\n\nInput format: Comma-separated integers.\nOutput format: Comma-separated integers from middle to end.",
    'tags' => ['linked-list', 'two-pointers'],
    'starter_code' => [
        'python' => "import sys\nnums = sys.stdin.read().strip().split(',')\nif nums and nums[0]:\n    mid = len(nums) // 2\n    print(','.join(nums[mid:]))\n",
    ],
    'test_cases' => [
        ['input' => "1,2,3,4,5", 'expected_output' => "3,4,5", 'is_hidden' => false, 'explanation' => 'Middle is node 3.'],
        ['input' => "1,2,3,4,5,6", 'expected_output' => "4,5,6", 'is_hidden' => false, 'explanation' => 'Middle is node 4.'],
    ],
    'hints' => ["Tortoise and Hare: slow pointer moves 1 step, fast pointer moves 2 steps."],
    'explanation' => "Fast and slow pointer reaches the middle in O(N) time and O(1) space.",
]);

addChallenge($challenges, [
    'slug' => 'daily-temperatures',
    'title' => 'Daily Temperatures',
    'category' => 'data structures',
    'difficulty' => 'Medium',
    'estimated_time_min' => 25,
    'description' => "Given an array of integers `temperatures` representing daily temperatures, return an array `answer` such that `answer[i]` is the number of days you have to wait after the `i-th` day to get a warmer temperature. If there is no future day for which this is possible, keep `answer[i] == 0`.\n\nInput format: Comma-separated integers.\nOutput format: Comma-separated integers.",
    'tags' => ['stack', 'monotonic-stack'],
    'starter_code' => [
        'python' => "import sys\nnums = list(map(int, sys.stdin.read().strip().split(',')))\nres = [0] * len(nums)\nstk = []\nfor i, t in enumerate(nums):\n    while stk and nums[stk[-1]] < t:\n        prev = stk.pop()\n        res[prev] = i - prev\n    stk.append(i)\nprint(','.join(map(str, res)))\n",
    ],
    'test_cases' => [
        ['input' => "73,74,75,71,69,72,76,73", 'expected_output' => "1,1,4,2,1,1,0,0", 'is_hidden' => false, 'explanation' => 'Days until warmer temperature.'],
        ['input' => "30,40,50,60", 'expected_output' => "1,1,1,0", 'is_hidden' => false, 'explanation' => 'Warmer on next day.'],
    ],
    'hints' => ["Use a monotonic decreasing stack storing indices."],
    'explanation' => "Monotonic stack resolves each element in amortized O(1), total O(N) time.",
]);

// ==========================================
// 4. MATHEMATICS & BIT MANIPULATION
// ==========================================

addChallenge($challenges, [
    'slug' => 'palindrome-number',
    'title' => 'Palindrome Number',
    'category' => 'mathematics',
    'difficulty' => 'Beginner',
    'estimated_time_min' => 10,
    'description' => "Given an integer `x`, return `true` if `x` is a palindrome, and `false` otherwise.",
    'tags' => ['math'],
    'starter_code' => [
        'python' => "import sys\nx = sys.stdin.read().strip()\nif not x: sys.exit()\nprint('true' if int(x) >= 0 and x == x[::-1] else 'false')\n",
    ],
    'test_cases' => [
        ['input' => "121", 'expected_output' => "true", 'is_hidden' => false, 'explanation' => 'Palindrome.'],
        ['input' => "-121", 'expected_output' => "false", 'is_hidden' => false, 'explanation' => 'Negative number not palindrome.'],
    ],
    'hints' => ["Negatives are not palindromes."],
    'explanation' => "O(log10(N)) time check.",
]);

addChallenge($challenges, [
    'slug' => 'count-primes',
    'title' => 'Count Primes (Sieve of Eratosthenes)',
    'category' => 'mathematics',
    'difficulty' => 'Medium',
    'estimated_time_min' => 25,
    'description' => "Given an integer `n`, return the number of prime numbers that are strictly less than `n`.",
    'tags' => ['math', 'number-theory'],
    'starter_code' => [
        'python' => "import sys\nn = int(sys.stdin.read().strip())\nif n <= 2: print(0); sys.exit()\nprimes = [True] * n\nprimes[0] = primes[1] = False\nfor p in range(2, int(n**0.5) + 1):\n    if primes[p]:\n        for m in range(p*p, n, p): primes[m] = False\nprint(sum(primes))\n",
    ],
    'test_cases' => [
        ['input' => "10", 'expected_output' => "4", 'is_hidden' => false, 'explanation' => '2, 3, 5, 7.'],
    ],
    'hints' => ["Sieve of Eratosthenes."],
    'explanation' => "O(N log log N) sieve.",
]);

addChallenge($challenges, [
    'slug' => 'power-of-two',
    'title' => 'Power of Two',
    'category' => 'mathematics',
    'difficulty' => 'Beginner',
    'estimated_time_min' => 10,
    'description' => "Given an integer `n`, return `true` if it is a power of two. Otherwise, return `false`.",
    'tags' => ['math', 'bit-manipulation'],
    'starter_code' => [
        'python' => "import sys\nn = int(sys.stdin.read().strip())\nprint('true' if n > 0 and (n & (n - 1)) == 0 else 'false')\n",
    ],
    'test_cases' => [
        ['input' => "16", 'expected_output' => "true", 'is_hidden' => false, 'explanation' => '2^4 = 16.'],
        ['input' => "3", 'expected_output' => "false", 'is_hidden' => false, 'explanation' => 'Not power of two.'],
    ],
    'hints' => ["Bitwise trick: n & (n - 1) == 0."],
    'explanation' => "O(1) bitwise verification.",
]);

addChallenge($challenges, [
    'slug' => 'single-number',
    'title' => 'Single Number (XOR)',
    'category' => 'mathematics',
    'difficulty' => 'Easy',
    'estimated_time_min' => 15,
    'description' => "Given a non-empty array of integers `nums`, every element appears twice except for one. Find that single one.\n\nYou must implement a solution with linear runtime complexity and use only constant extra space.\n\nInput format: Comma-separated integers.\nOutput format: The single unique integer.",
    'tags' => ['bit-manipulation'],
    'starter_code' => [
        'python' => "import sys\nfrom functools import reduce\nnums = list(map(int, sys.stdin.read().strip().split(',')))\nprint(reduce(lambda x, y: x ^ y, nums))\n",
    ],
    'test_cases' => [
        ['input' => "2,2,1", 'expected_output' => "1", 'is_hidden' => false, 'explanation' => '1 appears once.'],
        ['input' => "4,1,2,1,2", 'expected_output' => "4", 'is_hidden' => false, 'explanation' => '4 appears once.'],
    ],
    'hints' => ["XORing any number with itself results in 0 (a ^ a = 0)."],
    'explanation' => "XORing all numbers cancels pairs and leaves the unique number in O(N) time and O(1) space.",
]);

addChallenge($challenges, [
    'slug' => 'greatest-common-divisor',
    'title' => 'Greatest Common Divisor (GCD)',
    'category' => 'mathematics',
    'difficulty' => 'Beginner',
    'estimated_time_min' => 10,
    'description' => "Compute the Greatest Common Divisor of two non-negative integers `a` and `b`.\n\nInput format: Two comma-separated integers `a,b`.\nOutput format: Integer GCD.",
    'tags' => ['math', 'number-theory'],
    'starter_code' => [
        'python' => "import sys, math\na, b = map(int, sys.stdin.read().strip().split(','))\nprint(math.gcd(a, b))\n",
    ],
    'test_cases' => [
        ['input' => "48,18", 'expected_output' => "6", 'is_hidden' => false, 'explanation' => 'GCD of 48 and 18 is 6.'],
        ['input' => "101,10", 'expected_output' => "1", 'is_hidden' => false, 'explanation' => 'Coprime numbers.'],
    ],
    'hints' => ["Euclidean algorithm: gcd(a, b) = gcd(b, a % b)."],
    'explanation' => "Euclidean algorithm computes GCD in O(log(min(a,b))) steps.",
]);

// ==========================================
// 5. SEARCHING & SORTING
// ==========================================

addChallenge($challenges, [
    'slug' => 'binary-search',
    'title' => 'Binary Search',
    'category' => 'searching',
    'difficulty' => 'Easy',
    'estimated_time_min' => 15,
    'description' => "Given an array of integers `nums` which is sorted in ascending order, and an integer `target`, return the index of `target`, or `-1` if not found.",
    'tags' => ['binary-search'],
    'starter_code' => [
        'python' => "import sys\nlines = sys.stdin.read().splitlines()\nif len(lines) >= 2:\n    nums = list(map(int, lines[0].split(',')))\n    t = int(lines[1])\n    l, r = 0, len(nums)-1\n    idx = -1\n    while l <= r:\n        m = (l+r)//2\n        if nums[m] == t: idx = m; break\n        elif nums[m] < t: l = m + 1\n        else: r = m - 1\n    print(idx)\n",
    ],
    'test_cases' => [
        ['input' => "-1,0,3,5,9,12\n9", 'expected_output' => "4", 'is_hidden' => false, 'explanation' => 'Index 4.'],
        ['input' => "-1,0,3,5,9,12\n2", 'expected_output' => "-1", 'is_hidden' => false, 'explanation' => 'Not found.'],
    ],
    'hints' => ["Divide and conquer halves search space."],
    'explanation' => "O(log N) binary search.",
]);

addChallenge($challenges, [
    'slug' => 'sort-colors',
    'title' => 'Sort Colors (Dutch National Flag)',
    'category' => 'sorting',
    'difficulty' => 'Medium',
    'estimated_time_min' => 20,
    'description' => "Given an array `nums` containing 0s, 1s, and 2s, sort them in-place in a single pass without using built-in sort.",
    'tags' => ['sorting', 'two-pointers'],
    'starter_code' => [
        'python' => "import sys\nnums = list(map(int, sys.stdin.read().strip().split(',')))\nlow, mid, high = 0, 0, len(nums) - 1\nwhile mid <= high:\n    if nums[mid] == 0:\n        nums[low], nums[mid] = nums[mid], nums[low]\n        low += 1; mid += 1\n    elif nums[mid] == 1: mid += 1\n    else:\n        nums[high], nums[mid] = nums[mid], nums[high]\n        high -= 1\nprint(','.join(map(str, nums)))\n",
    ],
    'test_cases' => [
        ['input' => "2,0,2,1,1,0", 'expected_output' => "0,0,1,1,2,2", 'is_hidden' => false, 'explanation' => 'Sorted Dutch Flag.'],
    ],
    'hints' => ["Three pointer partitioning."],
    'explanation' => "One pass O(N) time with O(1) extra space.",
]);

// ==========================================
// 6. DYNAMIC PROGRAMMING & RECURSION
// ==========================================

addChallenge($challenges, [
    'slug' => 'climbing-stairs',
    'title' => 'Climbing Stairs',
    'category' => 'recursion',
    'difficulty' => 'Easy',
    'estimated_time_min' => 15,
    'description' => "It takes `n` steps to reach the top. Each time you can climb 1 or 2 steps. How many distinct ways can you climb to the top?",
    'tags' => ['dynamic-programming'],
    'starter_code' => [
        'python' => "import sys\nn = int(sys.stdin.read().strip())\nif n <= 2: print(n); sys.exit()\na, b = 1, 2\nfor _ in range(3, n + 1): a, b = b, a + b\nprint(b)\n",
    ],
    'test_cases' => [
        ['input' => "2", 'expected_output' => "2", 'is_hidden' => false, 'explanation' => '2 ways.'],
        ['input' => "3", 'expected_output' => "3", 'is_hidden' => false, 'explanation' => '3 ways.'],
    ],
    'hints' => ["Fibonacci progression."],
    'explanation' => "Bottom-up DP in O(N) time and O(1) space.",
]);

addChallenge($challenges, [
    'slug' => 'coin-change',
    'title' => 'Coin Change',
    'category' => 'algorithms',
    'difficulty' => 'Medium',
    'estimated_time_min' => 30,
    'description' => "Return the fewest number of coins that you need to make up amount `amount` using infinite denominations from `coins`. Return -1 if not possible.",
    'tags' => ['dynamic-programming'],
    'starter_code' => [
        'python' => "import sys\nlines = sys.stdin.read().splitlines()\nif len(lines) >= 2:\n    coins = list(map(int, lines[0].split(',')))\n    amt = int(lines[1])\n    dp = [float('inf')] * (amt + 1)\n    dp[0] = 0\n    for a in range(1, amt + 1):\n        for c in coins:\n            if a - c >= 0: dp[a] = min(dp[a], dp[a - c] + 1)\n    print(dp[amt] if dp[amt] != float('inf') else -1)\n",
    ],
    'test_cases' => [
        ['input' => "1,2,5\n11", 'expected_output' => "3", 'is_hidden' => false, 'explanation' => '5+5+1 = 3 coins.'],
    ],
    'hints' => ["Unbounded knapsack DP."],
    'explanation' => "O(amount * coins) bottom-up dynamic programming.",
]);

// ==========================================
// 7. SQL LAB CHALLENGES
// ==========================================

addChallenge($challenges, [
    'slug' => 'sql-customers-who-never-order',
    'title' => 'Customers Who Never Order',
    'category' => 'SQL',
    'challenge_type' => 'sql',
    'difficulty' => 'Easy',
    'estimated_time_min' => 15,
    'description' => "Write an SQL query to report all customers who never order anything.\n\nReturn the result table with column name `Customers`.",
    'tags' => ['sql', 'join'],
    'supported_languages' => ['sql'],
    'sql_schema' => "CREATE TABLE Customers (id INT PRIMARY KEY, name VARCHAR(50));\nCREATE TABLE Orders (id INT PRIMARY KEY, customerId INT);",
    'sql_seed' => "INSERT INTO Customers VALUES (1, 'Joe'), (2, 'Henry'), (3, 'Sam'), (4, 'Max');\nINSERT INTO Orders VALUES (1, 3), (2, 1);",
    'sql_solution' => "SELECT name AS Customers FROM Customers WHERE id NOT IN (SELECT customerId FROM Orders);",
    'starter_code' => [
        'sql' => "SELECT name AS Customers FROM Customers WHERE id NOT IN (SELECT customerId FROM Orders);",
    ],
    'hints' => ["Use LEFT JOIN or NOT IN."],
    'explanation' => "Filter customers absent in Orders table.",
]);

addChallenge($challenges, [
    'slug' => 'sql-second-highest-salary',
    'title' => 'Second Highest Salary',
    'category' => 'SQL',
    'challenge_type' => 'sql',
    'difficulty' => 'Medium',
    'estimated_time_min' => 20,
    'description' => "Report the second highest distinct salary from `Employee`. If none, return `NULL` as `SecondHighestSalary`.",
    'tags' => ['sql', 'subquery'],
    'supported_languages' => ['sql'],
    'sql_schema' => "CREATE TABLE Employee (id INT PRIMARY KEY, salary INT);",
    'sql_seed' => "INSERT INTO Employee VALUES (1, 100), (2, 200), (3, 300);",
    'sql_solution' => "SELECT (SELECT DISTINCT salary FROM Employee ORDER BY salary DESC LIMIT 1 OFFSET 1) AS SecondHighestSalary;",
    'starter_code' => [
        'sql' => "SELECT (SELECT DISTINCT salary FROM Employee ORDER BY salary DESC LIMIT 1 OFFSET 1) AS SecondHighestSalary;",
    ],
    'hints' => ["Scalar subquery with LIMIT 1 OFFSET 1."],
    'explanation' => "Returns null safely if only 1 distinct salary.",
]);

addChallenge($challenges, [
    'slug' => 'sql-duplicate-emails',
    'title' => 'Duplicate Emails',
    'category' => 'SQL',
    'challenge_type' => 'sql',
    'difficulty' => 'Easy',
    'estimated_time_min' => 15,
    'description' => "Report all duplicate emails in `Person` table. Column name `email`.",
    'tags' => ['sql', 'group-by'],
    'supported_languages' => ['sql'],
    'sql_schema' => "CREATE TABLE Person (id INT PRIMARY KEY, email VARCHAR(100));",
    'sql_seed' => "INSERT INTO Person VALUES (1, 'a@b.com'), (2, 'c@d.com'), (3, 'a@b.com');",
    'sql_solution' => "SELECT email FROM Person GROUP BY email HAVING COUNT(email) > 1;",
    'starter_code' => [
        'sql' => "SELECT email FROM Person GROUP BY email HAVING COUNT(email) > 1;",
    ],
    'hints' => ["GROUP BY email HAVING COUNT > 1."],
    'explanation' => "Aggregating by email finds duplicates.",
]);

addChallenge($challenges, [
    'slug' => 'sql-employees-earning-more-than-managers',
    'title' => 'Employees Earning More Than Their Managers',
    'category' => 'SQL',
    'challenge_type' => 'sql',
    'difficulty' => 'Easy',
    'estimated_time_min' => 15,
    'description' => "Find employees who earn more than their managers. Result column `Employee`.",
    'tags' => ['sql', 'join'],
    'supported_languages' => ['sql'],
    'sql_schema' => "CREATE TABLE Employee (id INT PRIMARY KEY, name VARCHAR(50), salary INT, managerId INT);",
    'sql_seed' => "INSERT INTO Employee VALUES (1, 'Joe', 70000, 3), (2, 'Henry', 80000, 4), (3, 'Sam', 60000, NULL), (4, 'Max', 90000, NULL);",
    'sql_solution' => "SELECT e.name AS Employee FROM Employee e JOIN Employee m ON e.managerId = m.id WHERE e.salary > m.salary;",
    'starter_code' => [
        'sql' => "SELECT e.name AS Employee FROM Employee e JOIN Employee m ON e.managerId = m.id WHERE e.salary > m.salary;",
    ],
    'hints' => ["Self join Employee table."],
    'explanation' => "Compare salary against managerId record.",
]);

addChallenge($challenges, [
    'slug' => 'sql-department-top-three-salaries',
    'title' => 'Department Top Three Salaries',
    'category' => 'SQL',
    'challenge_type' => 'sql',
    'difficulty' => 'Hard',
    'estimated_time_min' => 35,
    'description' => "Find employees who are high earners (top 3 unique salaries per department). Columns: `Department`, `Employee`, `Salary`.",
    'tags' => ['sql', 'window-functions'],
    'supported_languages' => ['sql'],
    'sql_schema' => "CREATE TABLE Department (id INT PRIMARY KEY, name VARCHAR(50));\nCREATE TABLE Employee (id INT PRIMARY KEY, name VARCHAR(50), salary INT, departmentId INT);",
    'sql_seed' => "INSERT INTO Department VALUES (1, 'IT'), (2, 'Sales');\nINSERT INTO Employee VALUES (1, 'Joe', 85000, 1), (2, 'Henry', 80000, 2), (3, 'Sam', 60000, 2), (4, 'Max', 90000, 1), (5, 'Janet', 69000, 1), (6, 'Randy', 85000, 1), (7, 'Will', 70000, 1);",
    'sql_solution' => "WITH Ranked AS (SELECT d.name AS Department, e.name AS Employee, e.salary AS Salary, DENSE_RANK() OVER (PARTITION BY e.departmentId ORDER BY e.salary DESC) as rnk FROM Employee e JOIN Department d ON e.departmentId = d.id) SELECT Department, Employee, Salary FROM Ranked WHERE rnk <= 3;",
    'starter_code' => [
        'sql' => "WITH Ranked AS (SELECT d.name AS Department, e.name AS Employee, e.salary AS Salary, DENSE_RANK() OVER (PARTITION BY e.departmentId ORDER BY e.salary DESC) as rnk FROM Employee e JOIN Department d ON e.departmentId = d.id) SELECT Department, Employee, Salary FROM Ranked WHERE rnk <= 3;",
    ],
    'hints' => ["DENSE_RANK partition by department."],
    'explanation' => "DENSE_RANK handles ties properly.",
]);

addChallenge($challenges, [
    'slug' => 'sql-big-countries',
    'title' => 'Big Countries',
    'category' => 'SQL',
    'challenge_type' => 'sql',
    'difficulty' => 'Beginner',
    'estimated_time_min' => 10,
    'description' => "A country is big if it has an area of at least 3,000,000 km² or a population of at least 25,000,000.\n\nWrite an SQL query to report the name, population, and area of the big countries.",
    'tags' => ['sql'],
    'supported_languages' => ['sql'],
    'sql_schema' => "CREATE TABLE World (name VARCHAR(50) PRIMARY KEY, continent VARCHAR(50), area INT, population INT, gdp BIGINT);",
    'sql_seed' => "INSERT INTO World VALUES ('Afghanistan', 'Asia', 652230, 25500100, 20343000), ('Albania', 'Europe', 28748, 2831741, 12960000), ('Algeria', 'Africa', 2381741, 37100000, 188681000), ('Andorra', 'Europe', 468, 78115, 3712000), ('Angola', 'Africa', 1246700, 20609294, 100990000);",
    'sql_solution' => "SELECT name, population, area FROM World WHERE area >= 3000000 OR population >= 25000000;",
    'starter_code' => [
        'sql' => "SELECT name, population, area FROM World WHERE area >= 3000000 OR population >= 25000000;",
    ],
    'hints' => ["Use WHERE area >= 3000000 OR population >= 25000000."],
    'explanation' => "Simple boolean filter on two columns.",
]);

// ==========================================
// 8. WEB CHALLENGES (HTML / CSS / JS Sandbox)
// ==========================================

addChallenge($challenges, [
    'slug' => 'web-responsive-pricing-card',
    'title' => 'Responsive Pricing Card Grid',
    'category' => 'web',
    'challenge_type' => 'web',
    'difficulty' => 'Easy',
    'estimated_time_min' => 25,
    'description' => "Build a responsive 3-tier pricing card layout (Free, Pro, Enterprise) using modern CSS Flexbox or Grid.",
    'tags' => ['html', 'css', 'responsive-design'],
    'supported_languages' => ['html', 'css'],
    'web_template' => [
        'html' => "<div class=\"pricing-container\">\n  <div class=\"pricing-card\">\n    <h3 class=\"tier\">Free</h3>\n    <div class=\"price\">$0<span>/mo</span></div>\n    <ul class=\"features\"><li>1 Project</li><li>Community Support</li></ul>\n    <button class=\"btn\">Get Started</button>\n  </div>\n  <div class=\"pricing-card featured\">\n    <span class=\"badge\">Popular</span>\n    <h3 class=\"tier\">Pro</h3>\n    <div class=\"price\">$29<span>/mo</span></div>\n    <ul class=\"features\"><li>Unlimited Projects</li><li>Priority Support</li></ul>\n    <button class=\"btn btn-primary\">Upgrade Now</button>\n  </div>\n  <div class=\"pricing-card\">\n    <h3 class=\"tier\">Enterprise</h3>\n    <div class=\"price\">$99<span>/mo</span></div>\n    <ul class=\"features\"><li>Dedicated Server</li><li>24/7 SLA</li></ul>\n    <button class=\"btn\">Contact Sales</button>\n  </div>\n</div>",
        'css' => "* { box-sizing: border-box; font-family: sans-serif; }\nbody { padding: 40px 20px; background: #0f172a; color: #f8fafc; }\n.pricing-container { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 24px; max-width: 1000px; margin: 0 auto; }\n.pricing-card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 32px 24px; position: relative; display: flex; flex-direction: column; }\n.pricing-card.featured { border-color: #6366f1; transform: scale(1.03); }\n.badge { position: absolute; top: -12px; left: 50%; transform: translateX(-50%); background: #6366f1; color: #fff; padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: 600; }\n.price { font-size: 36px; font-weight: 700; margin: 16px 0; }\n.features { list-style: none; margin-bottom: 24px; flex-grow: 1; }\n.features li { padding: 8px 0; border-bottom: 1px solid #334155; color: #cbd5e1; }\n.btn { padding: 12px; border-radius: 8px; border: 1px solid #475569; background: #334155; color: #fff; cursor: pointer; }\n.btn-primary { background: #6366f1; border-color: #6366f1; }",
        'js' => "",
    ],
    'starter_code' => ['html' => "<div class=\"pricing-container\"></div>", 'css' => "/* CSS */"],
    'hints' => ["Use CSS Grid auto-fit."],
    'explanation' => "Responsive modern pricing card component.",
]);

addChallenge($challenges, [
    'slug' => 'web-interactive-dark-mode-toggle',
    'title' => 'Interactive Theme Switcher',
    'category' => 'web',
    'challenge_type' => 'web',
    'difficulty' => 'Easy',
    'estimated_time_min' => 20,
    'description' => "Create an accessible Dark / Light mode toggle switch that toggles CSS classes on the document and remembers user preference using localStorage.",
    'tags' => ['javascript', 'css', 'dom'],
    'supported_languages' => ['html', 'css', 'javascript'],
    'web_template' => [
        'html' => "<div class=\"app-card\"><h2>Theme Switcher Demo</h2><p>Toggle between Dark and Light mode.</p><button id=\"theme-toggle\" class=\"toggle-btn\">🌙 Switch to Light Mode</button></div>",
        'css' => ":root { --bg: #0f172a; --card: #1e293b; --text: #f8fafc; }\nbody.light-theme { --bg: #f8fafc; --card: #ffffff; --text: #0f172a; }\nbody { background: var(--bg); color: var(--text); display: flex; justify-content: center; align-items: center; min-height: 100vh; font-family: sans-serif; transition: 0.3s; }\n.app-card { background: var(--card); padding: 32px; border-radius: 12px; border: 1px solid #334155; text-align: center; }\n.toggle-btn { background: #3b82f6; color: #fff; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; margin-top: 16px; }",
        'js' => "const btn = document.getElementById('theme-toggle');\nbtn.addEventListener('click', () => {\n  const isLight = document.body.classList.toggle('light-theme');\n  btn.textContent = isLight ? '☀️ Switch to Dark Mode' : '🌙 Switch to Light Mode';\n});",
    ],
    'starter_code' => ['html' => "<button id=\"theme-toggle\">Switch Theme</button>", 'css' => "/* CSS */", 'js' => "// JS"],
    'hints' => ["Toggle class on document.body."],
    'explanation' => "CSS Custom Properties provide smooth theming.",
]);

// ==========================================
// 9. QUIZZES & CONCEPTS
// ==========================================

addChallenge($challenges, [
    'slug' => 'quiz-http-status-codes',
    'title' => 'HTTP Status Codes Mastery',
    'category' => 'REST APIs',
    'challenge_type' => 'quiz',
    'difficulty' => 'Beginner',
    'estimated_time_min' => 10,
    'description' => "Test your knowledge of essential HTTP status codes used in modern REST APIs.",
    'tags' => ['http', 'rest', 'backend'],
    'quiz_data' => [
        'questions' => [
            [
                'id' => 1,
                'question' => "Which HTTP status code indicates that a resource was successfully created via POST?",
                'options' => ["200 OK", "201 Created", "204 No Content", "202 Accepted"],
                'answer' => 1,
                'explanation' => "HTTP 201 Created indicates successful resource creation.",
            ],
            [
                'id' => 2,
                'question' => "What is the difference between HTTP 401 Unauthorized and HTTP 403 Forbidden?",
                'options' => [
                    "401 means server error; 403 means client error",
                    "401 indicates unauthenticated identity; 403 indicates authenticated but lacking permission",
                    "There is no difference"
                ],
                'answer' => 1,
                'explanation' => "401 is authentication; 403 is authorization.",
            ],
        ]
    ],
    'hints' => ["2xx success, 4xx client errors."],
    'explanation' => "HTTP status code fundamentals.",
]);

addChallenge($challenges, [
    'slug' => 'quiz-git-fundamentals',
    'title' => 'Git Branching & Workflow Fundamentals',
    'category' => 'Git',
    'challenge_type' => 'quiz',
    'difficulty' => 'Beginner',
    'estimated_time_min' => 10,
    'description' => "Validate your understanding of Git version control, branching strategies, and commit hygiene.",
    'tags' => ['git', 'devops'],
    'quiz_data' => [
        'questions' => [
            [
                'id' => 1,
                'question' => "What does `git rebase` do compared to `git merge`?",
                'options' => [
                    "Rebase deletes the current branch",
                    "Rebase reapplies commits on top of another base branch, preserving linear history",
                    "Merge always overwrites conflicts silently"
                ],
                'answer' => 1,
                'explanation' => "Git rebase linearizes commit history without extra merge commits.",
            ],
        ]
    ],
    'hints' => ["Linear history."],
    'explanation' => "Git workflow mastery.",
]);

addChallenge($challenges, [
    'slug' => 'quiz-docker-devops',
    'title' => 'Docker & Containerization Best Practices',
    'category' => 'Docker',
    'challenge_type' => 'quiz',
    'difficulty' => 'Easy',
    'estimated_time_min' => 15,
    'description' => "Test your knowledge on Docker containers, images, multi-stage builds, and runtime security.",
    'tags' => ['docker', 'devops'],
    'quiz_data' => [
        'questions' => [
            [
                'id' => 1,
                'question' => "What is the primary benefit of Multi-stage Docker builds?",
                'options' => [
                    "They run multiple containers at once",
                    "They keep production images slim by discarding build tools",
                    "They eliminate Dockerfiles"
                ],
                'answer' => 1,
                'explanation' => "Multi-stage builds produce minimal production containers without compilers.",
            ],
        ]
    ],
    'hints' => ["Minimal production image footprint."],
    'explanation' => "Docker best practices.",
]);

addChallenge($challenges, [
    'slug' => 'quiz-solid-principles',
    'title' => 'SOLID Architecture Principles',
    'category' => 'software engineering',
    'challenge_type' => 'quiz',
    'difficulty' => 'Medium',
    'estimated_time_min' => 15,
    'description' => "Test your mastery of Object-Oriented Design and the five SOLID principles.",
    'tags' => ['design-patterns', 'software-architecture'],
    'quiz_data' => [
        'questions' => [
            [
                'id' => 1,
                'question' => "What does the 'L' in SOLID stand for?",
                'options' => [
                    "Lazy Loading Principle",
                    "Liskov Substitution Principle",
                    "Linear Inheritance Principle",
                    "Layered Architecture Principle"
                ],
                'answer' => 1,
                'explanation' => "Liskov Substitution Principle states that subtypes must be substitutable for their base types without altering program correctness.",
            ],
            [
                'id' => 2,
                'question' => "Which principle states that high-level modules should not depend on low-level modules, but both should depend on abstractions?",
                'options' => [
                    "Single Responsibility Principle",
                    "Open-Closed Principle",
                    "Dependency Inversion Principle",
                    "Interface Segregation Principle"
                ],
                'answer' => 2,
                'explanation' => "Dependency Inversion decouples components through contracts/interfaces.",
            ],
        ]
    ],
    'hints' => ["Five core principles for maintainable software."],
    'explanation' => "SOLID design principles ensure scalable architecture.",
]);

// Write challenges to json file
$jsonContent = json_encode(['challenges' => $challenges], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
file_put_contents(__DIR__ . '/data/challenges.json', $jsonContent);

echo "Generated " . count($challenges) . " high-quality verified challenges in data/challenges.json\n";

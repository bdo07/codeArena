import json
import os

data_path = os.path.join(os.path.dirname(__file__), 'data', 'challenges.json')
with open(data_path, 'r', encoding='utf-8') as f:
    existing_data = json.load(f)

challenges = existing_data.get('challenges', [])
existing_slugs = {c['slug'] for c in challenges}

def add_c(c_data):
    slug = c_data['slug']
    if slug in existing_slugs:
        return
    existing_slugs.add(slug)
    base = {
        'challenge_type': 'code',
        'category': 'algorithms',
        'difficulty': 'Easy',
        'estimated_time_min': 20,
        'supported_languages': ['python', 'javascript', 'cpp', 'java'],
        'time_limit_ms': 2000,
        'memory_limit_mb': 128,
        'tags': [],
        'starter_code': {},
        'test_cases': [],
        'hints': [],
        'explanation': None,
        'reference_solution': None,
        'sql_schema': None,
        'sql_seed': None,
        'sql_solution': None,
        'web_template': None,
        'quiz_data': None,
        'is_daily': False,
        'daily_date': None,
    }
    base.update(c_data)
    challenges.append(base)

# ==========================================================
# 1. ALGORITHMS: STRINGS & TWO POINTERS
# ==========================================================
add_c({
    'slug': 'valid-palindrome',
    'title': 'Valid Palindrome',
    'category': 'strings',
    'difficulty': 'Easy',
    'estimated_time_min': 15,
    'description': "A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward.\n\nGiven a string `s`, return `true` if it is a palindrome, or `false` otherwise.",
    'tags': ['string', 'two-pointers'],
    'starter_code': {
        'python': "import sys, re\ndef is_palindrome(s):\n    cleaned = re.sub(r'[^a-zA-Z0-9]', '', s).lower()\n    return 'true' if cleaned == cleaned[::-1] else 'false'\n\nif __name__ == '__main__':\n    print(is_palindrome(sys.stdin.read().strip()))\n",
        'javascript': "const fs = require('fs');\nconst s = fs.readFileSync(0, 'utf-8').trim();\nconst cleaned = s.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();\nconsole.log(cleaned === cleaned.split('').reverse().join('') ? 'true' : 'false');\n",
    },
    'test_cases': [
        {'input': 'A man, a plan, a canal: Panama', 'expected_output': 'true', 'is_hidden': False, 'points': 20},
        {'input': 'race a car', 'expected_output': 'false', 'is_hidden': False, 'points': 20},
        {'input': ' ', 'expected_output': 'true', 'is_hidden': True, 'points': 20},
        {'input': '0P', 'expected_output': 'false', 'is_hidden': True, 'points': 20},
        {'input': 'No lemon, no melon', 'expected_output': 'true', 'is_hidden': True, 'points': 20},
    ],
    'hints': ['Filter non-alphanumeric characters first and lowercase the string.'],
    'explanation': 'Use two pointers from head and tail or compare reverse strings in O(n) time.',
})

add_c({
    'slug': 'merge-sorted-array',
    'title': 'Merge Sorted Array',
    'category': 'arrays',
    'difficulty': 'Easy',
    'estimated_time_min': 20,
    'description': "You are given two integer arrays `nums1` and `nums2`, sorted in non-decreasing order.\n\nMerge `nums1` and `nums2` into a single array sorted in non-decreasing order.\n\nInput format: line 1 has comma-separated `nums1`, line 2 has comma-separated `nums2`.\nReturn comma-separated merged elements.",
    'tags': ['array', 'two-pointers', 'sorting'],
    'starter_code': {
        'python': "import sys\nlines = sys.stdin.read().strip().splitlines()\nnums1 = [int(x) for x in lines[0].split(',') if x.strip()] if len(lines) > 0 and lines[0].strip() else []\nnums2 = [int(x) for x in lines[1].split(',') if x.strip()] if len(lines) > 1 and lines[1].strip() else []\nres = sorted(nums1 + nums2)\nprint(','.join(map(str, res)))\n",
        'javascript': "const fs = require('fs');\nconst lines = fs.readFileSync(0, 'utf-8').trim().split('\\n');\nconst a = lines[0] ? lines[0].split(',').filter(Boolean).map(Number) : [];\nconst b = lines[1] ? lines[1].split(',').filter(Boolean).map(Number) : [];\nconsole.log(a.concat(b).sort((x,y) => x - y).join(','));\n",
    },
    'test_cases': [
        {'input': "1,2,3\n2,5,6", 'expected_output': '1,2,2,3,5,6', 'is_hidden': False, 'points': 20},
        {'input': "1\n", 'expected_output': '1', 'is_hidden': False, 'points': 20},
        {'input': "\n1", 'expected_output': '1', 'is_hidden': True, 'points': 20},
        {'input': "4,5,6\n1,2,3", 'expected_output': '1,2,3,4,5,6', 'is_hidden': True, 'points': 20},
        {'input': "-5,-2,0\n-3,1,4", 'expected_output': '-5,-3,-2,0,1,4', 'is_hidden': True, 'points': 20},
    ],
    'hints': ['Three pointers working backwards avoids overwriting in-place, or two pointers merge in O(m+n).'],
})

add_c({
    'slug': 'best-time-to-buy-and-sell-stock',
    'title': 'Best Time to Buy and Sell Stock',
    'category': 'algorithms',
    'difficulty': 'Easy',
    'estimated_time_min': 15,
    'description': "You are given an array `prices` where `prices[i]` is the price of a given stock on the `i-th` day.\n\nYou want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock.\n\nReturn the maximum profit you can achieve from this transaction. If you cannot achieve any profit, return 0.",
    'tags': ['array', 'dynamic-programming'],
    'starter_code': {
        'python': "import sys\ndef max_profit(prices):\n    min_p, max_p = float('inf'), 0\n    for p in prices:\n        min_p = min(min_p, p)\n        max_p = max(max_p, p - min_p)\n    return max_p\n\nif __name__ == '__main__':\n    raw = sys.stdin.read().strip()\n    prices = list(map(int, raw.split(','))) if raw else []\n    print(max_profit(prices))\n",
        'javascript': "const fs = require('fs');\nconst raw = fs.readFileSync(0, 'utf-8').trim();\nconst prices = raw ? raw.split(',').map(Number) : [];\nlet minP = Infinity, maxP = 0;\nfor (const p of prices) {\n    minP = Math.min(minP, p);\n    maxP = Math.max(maxP, p - minP);\n}\nconsole.log(maxP);\n",
    },
    'test_cases': [
        {'input': '7,1,5,3,6,4', 'expected_output': '5', 'is_hidden': False, 'points': 20},
        {'input': '7,6,4,3,1', 'expected_output': '0', 'is_hidden': False, 'points': 20},
        {'input': '2,4,1', 'expected_output': '2', 'is_hidden': True, 'points': 20},
        {'input': '1,2', 'expected_output': '1', 'is_hidden': True, 'points': 20},
        {'input': '3,2,6,5,0,3', 'expected_output': '4', 'is_hidden': True, 'points': 20},
    ],
    'hints': ['Maintain the minimum price seen so far as you iterate through the array.'],
})

# ==========================================================
# 2. SLIDING WINDOW & SEARCHING
# ==========================================================
add_c({
    'slug': 'binary-search',
    'title': 'Binary Search',
    'category': 'searching',
    'difficulty': 'Beginner',
    'estimated_time_min': 15,
    'description': "Given an array of integers `nums` which is sorted in ascending order, and an integer `target`, write a function to search `target` in `nums`.\n\nIf `target` exists, then return its 0-based index. Otherwise, return `-1`.\n\nYou must write an algorithm with `O(log n)` runtime complexity.",
    'tags': ['binary-search', 'array'],
    'starter_code': {
        'python': "import sys\ndef search(nums, target):\n    l, r = 0, len(nums) - 1\n    while l <= r:\n        mid = (l + r) // 2\n        if nums[mid] == target: return mid\n        elif nums[mid] < target: l = mid + 1\n        else: r = mid - 1\n    return -1\n\nif __name__ == '__main__':\n    lines = sys.stdin.read().strip().splitlines()\n    nums = list(map(int, lines[0].split(',')))\n    target = int(lines[1])\n    print(search(nums, target))\n",
        'javascript': "const fs = require('fs');\nconst lines = fs.readFileSync(0, 'utf-8').trim().split('\\n');\nconst nums = lines[0].split(',').map(Number);\nconst target = Number(lines[1]);\nlet l = 0, r = nums.length - 1, ans = -1;\nwhile (l <= r) {\n    const mid = Math.floor((l + r) / 2);\n    if (nums[mid] === target) { ans = mid; break; }\n    if (nums[mid] < target) l = mid + 1; else r = mid - 1;\n}\nconsole.log(ans);\n",
    },
    'test_cases': [
        {'input': "-1,0,3,5,9,12\n9", 'expected_output': '4', 'is_hidden': False, 'points': 20},
        {'input': "-1,0,3,5,9,12\n2", 'expected_output': '-1', 'is_hidden': False, 'points': 20},
        {'input': "5\n5", 'expected_output': '0', 'is_hidden': True, 'points': 20},
        {'input': "1,3,5,7,9,11,13\n13", 'expected_output': '6', 'is_hidden': True, 'points': 20},
        {'input': "1,3,5,7,9,11,13\n1", 'expected_output': '0', 'is_hidden': True, 'points': 20},
    ],
    'hints': ['Initialize two pointers: left=0, right=len-1. Calculate midpoint mid = left + (right-left)//2.'],
})

add_c({
    'slug': 'search-in-rotated-sorted-array',
    'title': 'Search in Rotated Sorted Array',
    'category': 'searching',
    'difficulty': 'Medium',
    'estimated_time_min': 25,
    'description': "There is an integer array `nums` sorted in ascending order with distinct values, rotated at an unknown pivot index.\n\nGiven the array `nums` and an integer `target`, return the index of `target` if it is in `nums`, or `-1` if it is not in `nums`.\n\nYou must achieve `O(log n)` runtime complexity.",
    'tags': ['binary-search', 'array'],
    'starter_code': {
        'python': "import sys\ndef search(nums, target):\n    l, r = 0, len(nums) - 1\n    while l <= r:\n        mid = (l + r) // 2\n        if nums[mid] == target: return mid\n        if nums[l] <= nums[mid]:\n            if nums[l] <= target < nums[mid]: r = mid - 1\n            else: l = mid + 1\n        else:\n            if nums[mid] < target <= nums[r]: l = mid + 1\n            else: r = mid - 1\n    return -1\n\nif __name__ == '__main__':\n    lines = sys.stdin.read().strip().splitlines()\n    nums = list(map(int, lines[0].split(',')))\n    target = int(lines[1])\n    print(search(nums, target))\n",
        'javascript': "const fs = require('fs');\nconst lines = fs.readFileSync(0, 'utf-8').trim().split('\\n');\nconst nums = lines[0].split(',').map(Number);\nconst target = Number(lines[1]);\nlet l = 0, r = nums.length - 1, res = -1;\nwhile (l <= r) {\n    const mid = Math.floor((l + r) / 2);\n    if (nums[mid] === target) { res = mid; break; }\n    if (nums[l] <= nums[mid]) {\n        if (nums[l] <= target && target < nums[mid]) r = mid - 1;\n        else l = mid + 1;\n    } else {\n        if (nums[mid] < target && target <= nums[r]) l = mid + 1;\n        else r = mid - 1;\n    }\n}\nconsole.log(res);\n",
    },
    'test_cases': [
        {'input': "4,5,6,7,0,1,2\n0", 'expected_output': '4', 'is_hidden': False, 'points': 20},
        {'input': "4,5,6,7,0,1,2\n3", 'expected_output': '-1', 'is_hidden': False, 'points': 20},
        {'input': "1\n0", 'expected_output': '-1', 'is_hidden': True, 'points': 20},
        {'input': "5,1,3\n5", 'expected_output': '0', 'is_hidden': True, 'points': 20},
        {'input': "4,5,6,7,8,1,2,3\n8", 'expected_output': '4', 'is_hidden': True, 'points': 20},
    ],
    'hints': ['At least one half of the rotated array is always strictly sorted. Determine which half is sorted and check if target lies within its bounds.'],
})

# ==========================================================
# 3. DYNAMIC PROGRAMMING
# ==========================================================
add_c({
    'slug': 'climbing-stairs',
    'title': 'Climbing Stairs',
    'category': 'recursion',
    'difficulty': 'Beginner',
    'estimated_time_min': 15,
    'description': "You are climbing a staircase. It takes `n` steps to reach the top.\n\nEach time you can either climb `1` or `2` steps. In how many distinct ways can you climb to the top?",
    'tags': ['dynamic-programming', 'math', 'recursion'],
    'starter_code': {
        'python': "import sys\ndef climb_stairs(n):\n    if n <= 2: return n\n    a, b = 1, 2\n    for _ in range(3, n + 1):\n        a, b = b, a + b\n    return b\n\nif __name__ == '__main__':\n    print(climb_stairs(int(sys.stdin.read().strip())))\n",
        'javascript': "const fs = require('fs');\nconst n = Number(fs.readFileSync(0, 'utf-8').trim());\nif (n <= 2) { console.log(n); process.exit(0); }\nlet a = 1, b = 2;\nfor (let i = 3; i <= n; i++) {\n    const c = a + b; a = b; b = c;\n}\nconsole.log(b);\n",
    },
    'test_cases': [
        {'input': '2', 'expected_output': '2', 'is_hidden': False, 'points': 20},
        {'input': '3', 'expected_output': '3', 'is_hidden': False, 'points': 20},
        {'input': '4', 'expected_output': '5', 'is_hidden': True, 'points': 20},
        {'input': '5', 'expected_output': '8', 'is_hidden': True, 'points': 20},
        {'input': '10', 'expected_output': '89', 'is_hidden': True, 'points': 20},
    ],
    'hints': ['To reach step n, you must arrive from step n-1 or step n-2. This is the Fibonacci recurrence!'],
})

add_c({
    'slug': 'coin-change',
    'title': 'Coin Change',
    'category': 'algorithms',
    'difficulty': 'Medium',
    'estimated_time_min': 30,
    'description': "You are given an integer array `coins` representing coins of different denominations and an integer `amount` representing a total amount of money.\n\nReturn the fewest number of coins that you need to make up that amount. If that amount of money cannot be made up by any combination of the coins, return `-1`.\n\nYou may assume that you have an infinite number of each kind of coin.",
    'tags': ['dynamic-programming', 'bfs'],
    'starter_code': {
        'python': "import sys\ndef coin_change(coins, amount):\n    dp = [float('inf')] * (amount + 1)\n    dp[0] = 0\n    for c in coins:\n        for i in range(c, amount + 1):\n            dp[i] = min(dp[i], dp[i - c] + 1)\n    return dp[amount] if dp[amount] != float('inf') else -1\n\nif __name__ == '__main__':\n    lines = sys.stdin.read().strip().splitlines()\n    coins = list(map(int, lines[0].split(',')))\n    amount = int(lines[1])\n    print(coin_change(coins, amount))\n",
        'javascript': "const fs = require('fs');\nconst lines = fs.readFileSync(0, 'utf-8').trim().split('\\n');\nconst coins = lines[0].split(',').map(Number);\nconst amount = Number(lines[1]);\nconst dp = new Array(amount + 1).fill(Infinity);\ndp[0] = 0;\nfor (const c of coins) {\n    for (let i = c; i <= amount; i++) {\n        dp[i] = Math.min(dp[i], dp[i - c] + 1);\n    }\n}\nconsole.log(dp[amount] === Infinity ? -1 : dp[amount]);\n",
    },
    'test_cases': [
        {'input': "1,2,5\n11", 'expected_output': '3', 'is_hidden': False, 'points': 20},
        {'input': "2\n3", 'expected_output': '-1', 'is_hidden': False, 'points': 20},
        {'input': "1\n0", 'expected_output': '0', 'is_hidden': True, 'points': 20},
        {'input': "186,419,83,408\n6249", 'expected_output': '20', 'is_hidden': True, 'points': 20},
        {'input': "2,5,10,1\n27", 'expected_output': '4', 'is_hidden': True, 'points': 20},
    ],
    'hints': ['Let dp[x] be the minimum coins needed to make x. dp[x] = min(dp[x - c] + 1) for each coin c.'],
})

add_c({
    'slug': 'longest-increasing-subsequence',
    'title': 'Longest Increasing Subsequence',
    'category': 'algorithms',
    'difficulty': 'Medium',
    'estimated_time_min': 25,
    'description': "Given an integer array `nums`, return the length of the longest strictly increasing subsequence.\n\nA subsequence is a sequence that can be derived from an array by deleting some or no elements without changing the order of the remaining elements.",
    'tags': ['dynamic-programming', 'binary-search'],
    'starter_code': {
        'python': "import sys, bisect\ndef length_of_lis(nums):\n    tails = []\n    for x in nums:\n        idx = bisect.bisect_left(tails, x)\n        if idx == len(tails): tails.append(x)\n        else: tails[idx] = x\n    return len(tails)\n\nif __name__ == '__main__':\n    raw = sys.stdin.read().strip()\n    nums = list(map(int, raw.split(','))) if raw else []\n    print(length_of_lis(nums))\n",
        'javascript': "const fs = require('fs');\nconst raw = fs.readFileSync(0, 'utf-8').trim();\nconst nums = raw ? raw.split(',').map(Number) : [];\nconst tails = [];\nfor (const x of nums) {\n    let l = 0, r = tails.length;\n    while (l < r) {\n        const mid = (l + r) >> 1;\n        if (tails[mid] < x) l = mid + 1; else r = mid;\n    }\n    if (l === tails.length) tails.push(x); else tails[l] = x;\n}\nconsole.log(tails.length);\n",
    },
    'test_cases': [
        {'input': '10,9,2,5,3,7,101,18', 'expected_output': '4', 'is_hidden': False, 'points': 20},
        {'input': '0,1,0,3,2,3', 'expected_output': '4', 'is_hidden': False, 'points': 20},
        {'input': '7,7,7,7,7,7,7', 'expected_output': '1', 'is_hidden': True, 'points': 20},
        {'input': '1,3,6,7,9,4,10,5,6', 'expected_output': '6', 'is_hidden': True, 'points': 20},
        {'input': '4,10,4,3,8,9', 'expected_output': '3', 'is_hidden': True, 'points': 20},
    ],
    'hints': ['Patience sorting with binary search allows O(n log n) determination of the longest increasing subsequence.'],
})

# ==========================================================
# 4. EXPERT / HARD ALGORITHMS
# ==========================================================
add_c({
    'slug': 'trapping-rain-water',
    'title': 'Trapping Rain Water',
    'category': 'algorithms',
    'difficulty': 'Hard',
    'estimated_time_min': 35,
    'description': "Given `n` non-negative integers representing an elevation map where the width of each bar is `1`, compute how much water it can trap after raining.\n\nInput format: A single line with comma-separated elevations.\nOutput format: An integer with total trapped water units.",
    'tags': ['array', 'two-pointers', 'stack'],
    'starter_code': {
        'python': "import sys\ndef trap(height):\n    if not height: return 0\n    l, r = 0, len(height) - 1\n    left_max, right_max = height[l], height[r]\n    water = 0\n    while l < r:\n        if left_max < right_max:\n            l += 1\n            left_max = max(left_max, height[l])\n            water += left_max - height[l]\n        else:\n            r -= 1\n            right_max = max(right_max, height[r])\n            water += right_max - height[r]\n    return water\n\nif __name__ == '__main__':\n    raw = sys.stdin.read().strip()\n    h = list(map(int, raw.split(','))) if raw else []\n    print(trap(h))\n",
        'javascript': "const fs = require('fs');\nconst raw = fs.readFileSync(0, 'utf-8').trim();\nconst h = raw ? raw.split(',').map(Number) : [];\nlet l = 0, r = h.length - 1, leftMax = 0, rightMax = 0, water = 0;\nwhile (l < r) {\n    if (h[l] < h[r]) {\n        if (h[l] >= leftMax) leftMax = h[l]; else water += leftMax - h[l];\n        l++;\n    } else {\n        if (h[r] >= rightMax) rightMax = h[r]; else water += rightMax - h[r];\n        r--;\n    }\n}\nconsole.log(water);\n",
    },
    'test_cases': [
        {'input': '0,1,0,2,1,0,1,3,2,1,2,1', 'expected_output': '6', 'is_hidden': False, 'points': 20},
        {'input': '4,2,0,3,2,5', 'expected_output': '9', 'is_hidden': False, 'points': 20},
        {'input': '3,0,0,2,0,4', 'expected_output': '10', 'is_hidden': True, 'points': 20},
        {'input': '2,0,2', 'expected_output': '2', 'is_hidden': True, 'points': 20},
        {'input': '5,4,3,2,1', 'expected_output': '0', 'is_hidden': True, 'points': 20},
    ],
    'hints': ['Use two pointers with left_max and right_max to calculate water level in O(n) time and O(1) space.'],
})

add_c({
    'slug': 'regular-expression-matching',
    'title': 'Regular Expression Matching',
    'category': 'algorithms',
    'difficulty': 'Expert',
    'estimated_time_min': 45,
    'description': "Given an input string `s` and a pattern `p`, implement regular expression matching with support for `'.'` and `'*'` where:\n- `'.'` Matches any single character.\n- `'*'` Matches zero or more of the preceding element.\n\nThe matching should cover the entire input string (not partial).\n\nInput format: line 1 string `s`, line 2 pattern `p`.\nReturn `true` or `false`.",
    'tags': ['string', 'dynamic-programming', 'recursion'],
    'starter_code': {
        'python': "import sys\ndef is_match(s, p):\n    memo = {}\n    def dp(i, j):\n        if (i, j) in memo: return memo[(i, j)]\n        if j == len(p): return i == len(s)\n        first = i < len(s) and p[j] in {s[i], '.'}\n        if j + 1 < len(p) and p[j + 1] == '*':\n            ans = dp(i, j + 2) or (first and dp(i + 1, j))\n        else:\n            ans = first and dp(i + 1, j + 1)\n        memo[(i, j)] = ans\n        return ans\n    return 'true' if dp(0, 0) else 'false'\n\nif __name__ == '__main__':\n    lines = sys.stdin.read().splitlines()\n    s = lines[0] if len(lines) > 0 else ''\n    p = lines[1] if len(lines) > 1 else ''\n    print(is_match(s, p))\n",
        'javascript': "const fs = require('fs');\nconst lines = fs.readFileSync(0, 'utf-8').split('\\n');\nconst s = lines[0] || '', p = lines[1] || '';\nconst memo = new Map();\nfunction dp(i, j) {\n    const k = i + ',' + j;\n    if (memo.has(k)) return memo.get(k);\n    if (j === p.length) return i === s.length;\n    const first = i < s.length && (p[j] === s[i] || p[j] === '.');\n    let ans = false;\n    if (j + 1 < p.length && p[j + 1] === '*') {\n        ans = dp(i, j + 2) || (first && dp(i + 1, j));\n    } else {\n        ans = first && dp(i + 1, j + 1);\n    }\n    memo.set(k, ans);\n    return ans;\n}\nconsole.log(dp(0, 0) ? 'true' : 'false');\n",
    },
    'test_cases': [
        {'input': "aa\na", 'expected_output': 'false', 'is_hidden': False, 'points': 20},
        {'input': "aa\na*", 'expected_output': 'true', 'is_hidden': False, 'points': 20},
        {'input': "ab\n.*", 'expected_output': 'true', 'is_hidden': True, 'points': 20},
        {'input': "aab\nc*a*b", 'expected_output': 'true', 'is_hidden': True, 'points': 20},
        {'input': "mississippi\nmis*is*p*.", 'expected_output': 'false', 'is_hidden': True, 'points': 20},
    ],
    'hints': ['Use 2D dynamic programming or top-down memoization checking whether p[j+1] == "*".'],
})

# ==========================================================
# 5. SQL LAB CHALLENGES
# ==========================================================
add_c({
    'slug': 'sql-department-top-three-salaries',
    'title': 'Department Top Three Salaries',
    'category': 'SQL',
    'challenge_type': 'sql',
    'difficulty': 'Hard',
    'estimated_time_min': 30,
    'description': "A company's executives are interested in seeing who earns the most money in each of the company's departments. A high earner in a department is an employee who has a salary in the top three unique salaries for that department.\n\nWrite an SQL query to find the employees who are high earners in each of the departments.\n\nOutput columns: `Department`, `Employee`, `Salary`.",
    'tags': ['sql', 'window-functions', 'dense-rank'],
    'supported_languages': ['sql'],
    'sql_schema': """CREATE TABLE Department (id INT PRIMARY KEY, name VARCHAR(50));
CREATE TABLE Employee (id INT PRIMARY KEY, name VARCHAR(50), salary INT, departmentId INT, FOREIGN KEY (departmentId) REFERENCES Department(id));""",
    'sql_seed': """INSERT INTO Department VALUES (1, 'IT'), (2, 'Sales');
INSERT INTO Employee VALUES (1, 'Joe', 85000, 1), (2, 'Henry', 80000, 2), (3, 'Sam', 60000, 2), (4, 'Max', 90000, 1), (5, 'Janet', 69000, 1), (6, 'Randy', 85000, 1), (7, 'Will', 70000, 1);""",
    'sql_solution': """SELECT d.name AS Department, e.name AS Employee, e.salary AS Salary
FROM (
    SELECT name, salary, departmentId, DENSE_RANK() OVER (PARTITION BY departmentId ORDER BY salary DESC) as rnk
    FROM Employee
) e
JOIN Department d ON e.departmentId = d.id
WHERE e.rnk <= 3
ORDER BY Department, Salary DESC, Employee;""",
    'starter_code': {
        'sql': """-- Write your query below:
SELECT d.name AS Department, e.name AS Employee, e.salary AS Salary
FROM Employee e
JOIN Department d ON e.departmentId = d.id;"""
    },
    'hints': ['Use DENSE_RANK() OVER (PARTITION BY departmentId ORDER BY salary DESC) to handle ties properly.'],
})

add_c({
    'slug': 'sql-consecutive-available-seats',
    'title': 'Consecutive Available Seats',
    'category': 'SQL',
    'challenge_type': 'sql',
    'difficulty': 'Medium',
    'estimated_time_min': 20,
    'description': "Several friends at a cinema want to sit in consecutive available seats. Write an SQL query to find all the consecutive available seats in the cinema.\n\nReturn the seat_id in ascending order.\n\nA seat is free if `free = 1`.",
    'tags': ['sql', 'self-join', 'window-functions'],
    'supported_languages': ['sql'],
    'sql_schema': "CREATE TABLE Cinema (seat_id INT PRIMARY KEY, free INT);",
    'sql_seed': "INSERT INTO Cinema VALUES (1, 1), (2, 0), (3, 1), (4, 1), (5, 1);",
    'sql_solution': """SELECT DISTINCT a.seat_id
FROM Cinema a
JOIN Cinema b ON ABS(a.seat_id - b.seat_id) = 1 AND a.free = 1 AND b.free = 1
ORDER BY a.seat_id;""",
    'starter_code': {
        'sql': "SELECT DISTINCT a.seat_id FROM Cinema a WHERE a.free = 1;"
    },
    'hints': ['Self-join Cinema with condition ABS(a.seat_id - b.seat_id) = 1 where both a and b are free.'],
})

add_c({
    'slug': 'sql-active-users-running-total',
    'title': 'Running Total of Daily Signups',
    'category': 'SQL',
    'challenge_type': 'sql',
    'difficulty': 'Medium',
    'estimated_time_min': 25,
    'description': "Write an SQL query to calculate the cumulative running total of new user signups for each day ordered chronologically.\n\nOutput columns: `signup_date`, `daily_count`, `cumulative_total`.",
    'tags': ['sql', 'window-functions', 'cumulative-sum'],
    'supported_languages': ['sql'],
    'sql_schema': "CREATE TABLE Signups (id INT PRIMARY KEY, user_id INT, signup_date DATE);",
    'sql_seed': """INSERT INTO Signups VALUES 
(1, 101, '2026-01-01'), (2, 102, '2026-01-01'), (3, 103, '2026-01-02'),
(4, 104, '2026-01-03'), (5, 105, '2026-01-03'), (6, 106, '2026-01-03');""",
    'sql_solution': """WITH DailyCounts AS (
    SELECT signup_date, COUNT(*) as daily_count
    FROM Signups
    GROUP BY signup_date
)
SELECT signup_date, daily_count,
       SUM(daily_count) OVER (ORDER BY signup_date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS cumulative_total
FROM DailyCounts
ORDER BY signup_date;""",
    'starter_code': {
        'sql': "SELECT signup_date, COUNT(*) as daily_count FROM Signups GROUP BY signup_date;"
    },
    'hints': ['Aggregate daily counts first in a CTE, then use SUM() OVER (ORDER BY signup_date).'],
})

# ==========================================================
# 6. WEB SANDBOX CHALLENGES (HTML / CSS / JS)
# ==========================================================
add_c({
    'slug': 'web-accordion-faq',
    'title': 'Interactive FAQ Accordion',
    'category': 'web',
    'challenge_type': 'web',
    'difficulty': 'Easy',
    'estimated_time_min': 25,
    'description': "Build an accessible, animated FAQ Accordion widget.\n\nRequirements:\n1. Clicking an accordion item header toggles the visibility of its corresponding body content.\n2. When opening an item, ensure other items collapse (or allow multiple open based on data attribute).\n3. Include a rotating chevron icon indicating open/closed state.\n4. Support smooth CSS transition on content expansion.",
    'tags': ['html', 'css', 'javascript', 'dom', 'ui'],
    'supported_languages': ['html', 'css', 'javascript'],
    'web_template': {
        'html': """<div class="faq-container">
  <h2>Frequently Asked Questions</h2>
  <div class="accordion">
    <div class="accordion-item">
      <button class="accordion-header">What is CodeArena? <span class="icon">▼</span></button>
      <div class="accordion-body">CodeArena is a competitive programming platform with isolated execution.</div>
    </div>
    <div class="accordion-item">
      <button class="accordion-header">Which languages are supported? <span class="icon">▼</span></button>
      <div class="accordion-body">Over 40 programming languages including Python, C++, JS, and SQL.</div>
    </div>
  </div>
</div>""",
        'css': """body { font-family: sans-serif; background: #09090b; color: #f4f4f5; padding: 20px; }
.faq-container { max-width: 500px; margin: 0 auto; }
.accordion-item { border-bottom: 1px solid #27272a; }
.accordion-header {
  width: 100%; padding: 14px 0; background: none; border: none; color: #fff;
  display: flex; justify-content: space-between; align-items: center; font-size: 15px; cursor: pointer;
}
.accordion-body {
  max-height: 0; overflow: hidden; transition: max-height 0.3s ease; color: #a1a1aa; font-size: 14px;
}
.accordion-item.active .accordion-body { max-height: 150px; padding-bottom: 14px; }
.accordion-item.active .icon { transform: rotate(180deg); }
.icon { transition: transform 0.3s ease; font-size: 12px; }""",
        'js': """document.querySelectorAll('.accordion-header').forEach(header => {
  header.addEventListener('click', () => {
    const item = header.parentElement;
    document.querySelectorAll('.accordion-item').forEach(other => {
      if (other !== item) other.classList.remove('active');
    });
    item.classList.toggle('active');
  });
});"""
    },
    'hints': ['Use classList.toggle("active") and CSS max-height transitions.'],
})

add_c({
    'slug': 'web-stopwatch-timer',
    'title': 'Digital Stopwatch & Lap Timer',
    'category': 'web',
    'challenge_type': 'web',
    'difficulty': 'Medium',
    'estimated_time_min': 30,
    'description': "Create a precision digital stopwatch with Millisecond tracking, Start, Pause, Reset, and Lap recording.\n\nRequirements:\n1. Display formatted `MM:SS:ms` with leading zeros.\n2. Start / Pause buttons toggle state smoothly.\n3. Lap button records the split time and appends it to a lap scroll list.\n4. Reset restores the timer to `00:00:00`.",
    'tags': ['javascript', 'css', 'html', 'timing'],
    'supported_languages': ['html', 'css', 'javascript'],
    'web_template': {
        'html': """<div class="stopwatch-card">
  <div class="display" id="timeDisplay">00:00:00</div>
  <div class="controls">
    <button id="startBtn" class="btn primary">Start</button>
    <button id="lapBtn" class="btn secondary" disabled>Lap</button>
    <button id="resetBtn" class="btn danger">Reset</button>
  </div>
  <ul id="lapsList" class="laps"></ul>
</div>""",
        'css': """body { background: #09090b; color: white; display: flex; justify-content: center; align-items: center; min-height: 100vh; font-family: monospace; }
.stopwatch-card { background: #18181b; padding: 24px; border-radius: 16px; border: 1px solid #27272a; width: 320px; text-align: center; }
.display { font-size: 36px; font-weight: bold; margin-bottom: 20px; color: #a855f7; }
.controls { display: flex; gap: 8px; justify-content: center; }
.btn { padding: 8px 16px; border-radius: 8px; border: none; cursor: pointer; font-weight: bold; font-family: inherit; }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.primary { background: #8b5cf6; color: white; }
.secondary { background: #27272a; color: white; }
.danger { background: #e11d48; color: white; }
.laps { margin-top: 16px; text-align: left; max-height: 120px; overflow-y: auto; padding-left: 0; list-style: none; font-size: 13px; color: #a1a1aa; }
.laps li { padding: 4px 0; border-bottom: 1px solid #27272a; display: flex; justify-content: space-between; }""",
        'js': """let startTime = 0, elapsed = 0, timerId = null;
const display = document.getElementById('timeDisplay');
const startBtn = document.getElementById('startBtn');
const lapBtn = document.getElementById('lapBtn');
const resetBtn = document.getElementById('resetBtn');
const lapsList = document.getElementById('lapsList');

function format(ms) {
  const m = Math.floor(ms / 60000).toString().padStart(2, '0');
  const s = Math.floor((ms % 60000) / 1000).toString().padStart(2, '0');
  const d = Math.floor((ms % 1000) / 10).toString().padStart(2, '0');
  return `${m}:${s}:${d}`;
}

startBtn.addEventListener('click', () => {
  if (!timerId) {
    startTime = Date.now() - elapsed;
    timerId = setInterval(() => {
      elapsed = Date.now() - startTime;
      display.textContent = format(elapsed);
    }, 10);
    startBtn.textContent = 'Pause';
    lapBtn.disabled = false;
  } else {
    clearInterval(timerId);
    timerId = null;
    startBtn.textContent = 'Start';
  }
});

resetBtn.addEventListener('click', () => {
  clearInterval(timerId);
  timerId = null;
  elapsed = 0;
  display.textContent = '00:00:00';
  startBtn.textContent = 'Start';
  lapBtn.disabled = true;
  lapsList.innerHTML = '';
});

lapBtn.addEventListener('click', () => {
  const li = document.createElement('li');
  li.innerHTML = `<span>Lap ${lapsList.children.length + 1}</span><span>${format(elapsed)}</span>`;
  lapsList.prepend(li);
});"""
    },
    'hints': ['Store elapsed time and use Date.now() differences instead of simple increments to avoid interval drift.'],
})

# ==========================================================
# 7. ENGINEERING & DEVOPS QUIZZES
# ==========================================================
add_c({
    'slug': 'docker-fundamentals-quiz',
    'title': 'Docker & Containers Mastery Quiz',
    'category': 'Docker',
    'challenge_type': 'quiz',
    'difficulty': 'Easy',
    'estimated_time_min': 15,
    'description': "Verify your practical knowledge of containerization concepts, Dockerfiles, volume mounts, and network isolation.",
    'tags': ['docker', 'devops', 'containers'],
    'quiz_data': [
        {
            'id': 'd1',
            'question': 'What is the primary difference between COPY and ADD in a Dockerfile?',
            'options': [
                'COPY only copies local files, whereas ADD can extract tar archives and download from URLs',
                'ADD only copies local files, whereas COPY can download from remote URLs',
                'There is no difference; they are exact aliases',
                'COPY creates a new container layer, whereas ADD modifies the existing layer'
            ],
            'correct_index': 0,
            'explanation': 'COPY is preferred for simple local file copies. ADD supports auto-extraction of tarballs and fetching URLs.'
        },
        {
            'id': 'd2',
            'question': 'Which Docker command removes all stopped containers, unused networks, and dangling images?',
            'options': [
                'docker system prune',
                'docker rm -f all',
                'docker clean --all',
                'docker image purge'
            ],
            'correct_index': 0,
            'explanation': 'docker system prune cleans up unused data including dangling images, stopped containers, and networks.'
        },
        {
            'id': 'd3',
            'question': 'What is the purpose of multi-stage builds in Dockerfiles?',
            'options': [
                'To produce minimal production images by discarding build tools and intermediate artifacts',
                'To run multiple containers simultaneously from a single Dockerfile',
                'To automatically configure container auto-scaling in Kubernetes',
                'To compile native code across multiple operating systems in parallel'
            ],
            'correct_index': 0,
            'explanation': 'Multi-stage builds separate the compile stage (SDKs, compilers) from the final lean runtime container.'
        }
    ],
})

add_c({
    'slug': 'linux-bash-command-line-quiz',
    'title': 'Linux & Bash Scripting Essentials',
    'category': 'Linux',
    'challenge_type': 'quiz',
    'difficulty': 'Easy',
    'estimated_time_min': 15,
    'description': "Test your understanding of Unix file permissions, process management, standard streams, and piping.",
    'tags': ['linux', 'bash', 'cli'],
    'quiz_data': [
        {
            'id': 'l1',
            'question': 'What does chmod 755 filename grant to User, Group, and Others?',
            'options': [
                'User: rwx (7), Group: r-x (5), Others: r-x (5)',
                'User: rw- (6), Group: r-- (4), Others: r-- (4)',
                'User: rwx (7), Group: rw- (6), Others: r-- (4)',
                'User: r-x (5), Group: r-x (5), Others: rwx (7)'
            ],
            'correct_index': 0,
            'explanation': '7 = 4(r) + 2(w) + 1(x). 5 = 4(r) + 1(x). Thus 755 means rwxr-xr-x.'
        },
        {
            'id': 'l2',
            'question': 'How do you redirect standard error (stderr) to standard output (stdout) in Bash?',
            'options': [
                '2>&1',
                '1>&2',
                '>&all',
                '2> stdout'
            ],
            'correct_index': 0,
            'explanation': 'File descriptor 2 is stderr, and 1 is stdout. "2>&1" redirects stderr into stdout stream.'
        },
        {
            'id': 'l3',
            'question': 'Which signal is sent by kill -9 <PID>?',
            'options': [
                'SIGKILL (uninterceptable immediate termination)',
                'SIGTERM (graceful termination request)',
                'SIGINT (keyboard interrupt Ctrl+C)',
                'SIGHUP (hangup signal)'
            ],
            'correct_index': 0,
            'explanation': 'Signal 9 is SIGKILL, which cannot be caught or ignored by the target process.'
        }
    ],
})

add_c({
    'slug': 'software-architecture-design-patterns-quiz',
    'title': 'Software Architecture & Design Patterns',
    'category': 'software engineering',
    'challenge_type': 'quiz',
    'difficulty': 'Medium',
    'estimated_time_min': 20,
    'description': "Evaluate your understanding of GoF patterns, SOLID principles, and clean architectural paradigms.",
    'tags': ['design-patterns', 'solid', 'architecture'],
    'quiz_data': [
        {
            'id': 'p1',
            'question': 'What is the core principle behind the Dependency Inversion Principle (DIP)?',
            'options': [
                'High-level modules should not depend on low-level modules; both should depend on abstractions',
                'Every class must be instantiated via a dependency injection framework container',
                'Subclasses must always override all methods of their parent class',
                'Database drivers must execute within a separate independent thread pool'
            ],
            'correct_index': 0,
            'explanation': 'DIP states that high-level business logic should depend on interfaces/abstractions, not concrete implementations.'
        },
        {
            'id': 'p2',
            'question': 'Which design pattern allows attaching additional responsibilities to an object dynamically without modifying original class?',
            'options': [
                'Decorator Pattern',
                'Singleton Pattern',
                'Adapter Pattern',
                'Facade Pattern'
            ],
            'correct_index': 0,
            'explanation': 'Decorator pattern wraps the original object inside a decorator class that mirrors its interface and adds behavior.'
        },
        {
            'id': 'p3',
            'question': 'What distinguishes the Circuit Breaker pattern in distributed microservices?',
            'options': [
                'It prevents a service from repeatedly calling a failing downstream dependency, allowing recovery',
                'It terminates unauthorized API requests using cryptographic HMAC verification',
                'It automatically merges split-brain Redis cluster partitions',
                'It balances HTTP traffic uniformly across all available Kubernetes pods'
            ],
            'correct_index': 0,
            'explanation': 'Circuit Breaker trips to "Open" state when error rates exceed threshold, fast-failing to protect both caller and callee.'
        }
    ],
})

# Save updated challenges
with open(data_path, 'w', encoding='utf-8') as f:
    json.dump({'challenges': challenges}, f, indent=2, ensure_ascii=False)

print(f"Total challenges now: {len(challenges)}")

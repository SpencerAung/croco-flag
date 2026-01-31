# 1. Targeting Rules (targeting_rules)
Think of these as a series of "Concept Gates" that a user must pass through to see a feature.

* The "Who" (Targeting): You aren't just turning a flag ON or OFF for everyone. You are defining logic like:

  * Examples: "Users with email ending in @company.com" OR "Users where country is US".
  * The Schema:
    * `attribute`: The key to look at on the user object (e.g., 'email').
    * `operator`: The logic to apply (e.g., 'contains', 'equals', 'in').
    * `value`: The data to compare against (e.g., '@company.com').

* The "Chance" (Rollout): Even if a user matches the rule, you might not want to give it to all of them (e.g., a "Canary" release).

  * The Schema:
    * `rollout_percentage`: An integer (0-100). If it's 100, everyone matching the rule gets it. If it's 50, only half do. This is usually determined by hashing the `user_id` so the same user always falls in the same bucket.

* The "Order" (Priority):
  * Rules are evaluated top-to-bottom based on priority.
  * First Match Wins: The moment a user matches a rule, evaluation stops, and they get that rule's result.

# 2. Flag Evaluations (flag_evaluations)
This table is your Analytics / Audit Log. It answers: "Who saw what and when?"

* Purpose: It is not used to decide if a feature is on/off. It is a record of what happened after the decision was made.
* Use Cases:
  * Debugging: "Why did user X see the old checkout page?" -> Check the logs.
  * Analytics: "How many users actually saw the new feature yesterday?"
* The Schema:
  * `flag_id` + `user_id`: linking the specific event to the user and feature.
  * `result`: The final boolean (true/false) that was returned to the application.
  * `evaluated_at`: Timestamp for the event.

# Summary of the Flow:
1. Request: App asks "Is Flag A enabled for User X?"
2. Check Flag: Is the flag globally enabled? If no, return false.
3. Check Rules:
  * Fetch all `targeting_rules` for Flag A, sorted by priority.
  * Does User X match Rule 1?
    * If Yes: Check `rollout_percentage`. Return result. STOP.
    * If No: Move to Rule 2.
4. Default: If no rules match (or no rules exist), return the flag's default enabled state (some systems have a specific "default variation").
5. Log: Insert a row into `flag_evaluations` recording the outcome.
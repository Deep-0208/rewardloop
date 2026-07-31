ALTER TABLE reward_rules DROP CONSTRAINT IF EXISTS reward_rules_reward_percentage_check;
ALTER TABLE reward_rules ADD CONSTRAINT reward_rules_reward_percentage_check CHECK (reward_percentage BETWEEN 1 AND 100);

ALTER TABLE reward_rules DROP CONSTRAINT IF EXISTS reward_rules_max_redeem_percentage_check;
ALTER TABLE reward_rules ADD CONSTRAINT reward_rules_max_redeem_percentage_check CHECK (max_redeem_percentage BETWEEN 1 AND 100);

-- Fix critical security issue: Prevent direct writes to user_roles
CREATE POLICY "No direct inserts" ON user_roles
FOR INSERT TO authenticated
WITH CHECK (false);

CREATE POLICY "No direct updates" ON user_roles
FOR UPDATE TO authenticated
USING (false);

CREATE POLICY "No direct deletes" ON user_roles
FOR DELETE TO authenticated
USING (false);

-- Allow service role (edge functions) to manage roles
CREATE POLICY "Service role can manage roles" ON user_roles
FOR ALL TO service_role
USING (true)
WITH CHECK (true);
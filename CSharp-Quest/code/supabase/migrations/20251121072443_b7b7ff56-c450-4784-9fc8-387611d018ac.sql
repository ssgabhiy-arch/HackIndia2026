-- Add UPDATE policy to user_tokens table for consistency
CREATE POLICY "Users can update own tokens" 
ON public.user_tokens 
FOR UPDATE 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);
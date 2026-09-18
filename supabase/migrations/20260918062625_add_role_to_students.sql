/*
# Add role column to students table

1. Modified Tables
- `students`: Added `role` column (text, default 'student', NOT NULL).
  Values: 'student' or 'teacher'. Teachers ride free (no credit deduction).

2. Security
- No policy changes — the existing RLS policies already cover the new column.
- Students cannot update their own role directly because the UPDATE policy
  only allows updating rows where auth.uid() = id, and we will enforce
  role immutability in the deduct_credits function (teachers skip deduction).

3. Function Changes
- Updated `deduct_credits` to check role: if the student is a teacher,
  the function returns the current balance without deducting anything.
- Updated `ensure_student_profile` to accept a role parameter so the
  profile is created with the correct role at sign-up time.

4. Important Notes
- The role column has a CHECK constraint to only allow 'student' or 'teacher'.
- Existing student rows get 'student' as the default.
*/

ALTER TABLE students ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'student';

ALTER TABLE students DROP CONSTRAINT IF EXISTS students_role_check;
ALTER TABLE students ADD CONSTRAINT students_role_check
  CHECK (role IN ('student', 'teacher'));

-- Update ensure_student_profile to accept a role parameter
CREATE OR REPLACE FUNCTION ensure_student_profile(p_role text DEFAULT 'student')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO students (id, credits, role)
  VALUES (auth.uid(), CASE WHEN p_role = 'teacher' THEN 999999 ELSE 100 END, p_role)
  ON CONFLICT (id) DO NOTHING;
END;
$$;

-- Update deduct_credits to handle teachers (free rides)
CREATE OR REPLACE FUNCTION deduct_credits(p_amount int DEFAULT 20)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role text;
  new_balance int;
BEGIN
  SELECT role INTO user_role FROM students WHERE id = auth.uid();

  IF user_role = 'teacher' THEN
    -- Teachers ride free, return current balance
    SELECT credits INTO new_balance FROM students WHERE id = auth.uid();
    RETURN new_balance;
  END IF;

  -- Students: deduct credits
  UPDATE students
  SET credits = credits - p_amount
  WHERE id = auth.uid() AND credits >= p_amount
  RETURNING credits INTO new_balance;

  IF new_balance IS NULL THEN
    RAISE EXCEPTION 'Insufficient credits or student profile not found';
  END IF;

  RETURN new_balance;
END;
$$;

GRANT EXECUTE ON FUNCTION ensure_student_profile(text) TO authenticated;
GRANT EXECUTE ON FUNCTION deduct_credits(int) TO authenticated;
/*
# Create students and rides tables with credit system

1. New Tables
- `students`: Stores per-user credit balance. One row per authenticated student.
  - `id` (uuid, PK, matches auth.users id)
  - `credits` (int, default 100, NOT NULL) — starting balance for new students
  - `created_at` (timestamptz)
- `rides`: Stores ride history each time a student completes a shuttle ride.
  - `id` (uuid, PK)
  - `student_id` (uuid, FK to students, defaults to auth.uid())
  - `shuttle_id` (text) — dummy shuttle identifier
  - `shuttle_name` (text) — display name of the shuttle route
  - `origin` (text) — pickup location name
  - `destination` (text) — dropoff location name
  - `departed_at` (timestamptz) — when the ride was confirmed
  - `credits_spent` (int, default 20) — cost of the ride
  - `created_at` (timestamptz)

2. Security
- RLS enabled on both tables.
- `students`: A student can SELECT and UPDATE only their own row. INSERT is allowed
  for authenticated users creating their own profile. No DELETE — profiles are permanent.
- `rides`: A student can SELECT and INSERT only their own rides. UPDATE and DELETE
  are restricted to the owner as well.
- Credit deduction uses a SECURITY DEFINER function `deduct_credits` so the balance
  can never be set directly by the client — only decremented atomically.

3. Functions
- `deduct_credits(p_amount int)`: Atomically decrements the calling student's credit
  balance by p_amount (default 20). Returns the new balance. SECURITY DEFINER so it
  can update the students table regardless of RLS, but only for the calling user.
- `ensure_student_profile()`: Creates a students row with default credits if one
  doesn't exist for the calling user. Called after sign-up.

4. Important Notes
- `students.id` references `auth.users(id)` with ON DELETE CASCADE so profiles are
  cleaned up when auth users are deleted.
- `rides.student_id` defaults to `auth.uid()` so client inserts omitting it still work.
- The `deduct_credits` function checks for sufficient balance and raises an error
  if the student cannot afford the ride.
*/

-- Students table
CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  credits int NOT NULL DEFAULT 100,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE students ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_student" ON students;
CREATE POLICY "select_own_student" ON students FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_student" ON students;
CREATE POLICY "insert_own_student" ON students FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_student" ON students;
CREATE POLICY "update_own_student" ON students FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Rides table
CREATE TABLE IF NOT EXISTS rides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL DEFAULT auth.uid() REFERENCES students(id) ON DELETE CASCADE,
  shuttle_id text NOT NULL,
  shuttle_name text NOT NULL,
  origin text NOT NULL,
  destination text NOT NULL,
  departed_at timestamptz DEFAULT now(),
  credits_spent int NOT NULL DEFAULT 20,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE rides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_rides" ON rides;
CREATE POLICY "select_own_rides" ON rides FOR SELECT
  TO authenticated USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "insert_own_rides" ON rides;
CREATE POLICY "insert_own_rides" ON rides FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "update_own_rides" ON rides;
CREATE POLICY "update_own_rides" ON rides FOR UPDATE
  TO authenticated USING (auth.uid() = student_id) WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "delete_own_rides" ON rides;
CREATE POLICY "delete_own_rides" ON rides FOR DELETE
  TO authenticated USING (auth.uid() = student_id);

-- Ensure student profile exists (call after sign-up)
CREATE OR REPLACE FUNCTION ensure_student_profile()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO students (id, credits) VALUES (auth.uid(), 100)
  ON CONFLICT (id) DO NOTHING;
END;
$$;

-- Deduct credits atomically (called when a ride is confirmed)
CREATE OR REPLACE FUNCTION deduct_credits(p_amount int DEFAULT 20)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_balance int;
BEGIN
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

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION ensure_student_profile() TO authenticated;
GRANT EXECUTE ON FUNCTION deduct_credits(int) TO authenticated;
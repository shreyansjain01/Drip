-- Seed Default System Categories (user_id is null)
insert into public.categories (name, icon, color, keywords) values
  ('Food & Drinks', 'Utensils', '#B8ACFA', array['food', 'breakfast', 'lunch', 'dinner', 'snacks', 'chai', 'coffee', 'starbucks', 'mcdonalds', 'swiggy', 'zomato', 'restaurant', 'cafe', 'biryani', 'pizza', 'burger', 'dosa', 'chai 20', 'tea']),
  ('Transport', 'Car', '#D8D1FD', array['transport', 'auto', 'uber', 'ola', 'cab', 'taxi', 'petrol', 'diesel', 'fuel', 'metro', 'bus', 'train', 'flight', 'parking', 'toll']),
  ('Shopping', 'ShoppingBag', '#8E7DF0', array['shopping', 'amazon', 'flipkart', 'myntra', 'clothes', 'shoes', 'electronics', 'mall', 'store', 'zara', 'h&m']),
  ('Bills & Utilities', 'Receipt', '#FBF8EC', array['bills', 'electricity', 'water', 'gas', 'wifi', 'broadband', 'mobile', 'recharge', 'rent', 'maintenance', 'subscription', 'netflix', 'spotify', 'apple', 'icloud', 'prime']),
  ('Groceries', 'Package', '#B8ACFA', array['groceries', 'supermarket', 'blinkit', 'zepto', 'instamart', 'vegetables', 'fruits', 'milk', 'bread', 'ration', 'kirana']),
  ('Entertainment', 'Film', '#D8D1FD', array['entertainment', 'movie', 'cinema', 'pvr', 'theatre', 'gaming', 'steam', 'concert', 'party', 'outing', 'club']),
  ('Health & Medical', 'HeartPulse', '#8E7DF0', array['health', 'medical', 'medicine', 'pharmacy', 'doctor', 'clinic', 'hospital', 'apollo', '1mg', 'gym', 'fitness', 'supplement']),
  ('Travel', 'Plane', '#FBF8EC', array['travel', 'hotel', 'resort', 'airbnb', 'vacation', 'trip', 'goa', 'booking', 'makemytrip', 'tour']),
  ('General', 'HelpCircle', '#B8ACFA', array['general', 'miscellaneous', 'cash', 'transfer', 'other'])
on conflict do nothing;

-- Function & Trigger: on new user signup, automatically seed profile, default reminder slots, and default plan_fields (Expenses and Savings)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  -- 1. Create Profile
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;

  -- 2. Seed Default Locked Plan Fields (1: Expenses, 2: Savings)
  insert into public.plan_fields (user_id, kind, name, planned_paise, sort_order, locked)
  values
    (new.id, 'expenses', 'Expenses', 0, 1, true),
    (new.id, 'savings', 'Savings', 0, 2, true)
  on conflict do nothing;

  -- 3. Seed Cold-Start Default Reminder Slots (09:00, 13:00, 19:00, 21:00)
  insert into public.reminder_slots (user_id, local_time, label, enabled, origin)
  values
    (new.id, '09:00:00', 'Breakfast', true, 'default'),
    (new.id, '13:00:00', 'Lunch', true, 'default'),
    (new.id, '19:00:00', 'Snacks', true, 'default'),
    (new.id, '21:00:00', 'Dinner', true, 'default')
  on conflict do nothing;

  return new;
end;
$$ language plpgsql security definer;

-- Trigger execution on auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

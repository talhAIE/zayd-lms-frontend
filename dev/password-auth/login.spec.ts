import {test,expect} from '@playwright/test';

for(const scenario of [
  {username:'student.account',password:'Student123',role:'STUDENT',url:'/student/courses'},
  {username:'teacher.account',password:'P@55words',role:'TEACHER',url:'/teacher/dashboard'},
  {username:'super.admin.zayd',password:'P@55words',role:'ZAYD_SUPER_ADMIN',url:'/admin/dashboard'},
  {username:'super.admin.zayd.nafs',password:'P@55words',role:'NAFS_SUPER_ADMIN',url:'/admin/dashboard'},
  {username:'qa.test.student',password:'test',role:'STUDENT',url:'/student/courses'},
])test(`${scenario.role} / ${scenario.username}: password validation and existing redirect`,async({page})=>{
  let submissions=0;
  const user={id:'local-fixture',username:scenario.username,role:scenario.role,firstName:'Local',lastName:'Tester',phoneNumber:'0500000000',acceptedTerms:true,schoolCategory:'American',schoolName:'Local QA School',region:'ROW'};
  await page.route('**/api/v1/**',async route=>{
    const req=route.request(),url=new URL(req.url());
    if(url.pathname==='/api/v1/auth/login'){
      submissions++;const body=req.postDataJSON();
      expect(body.username).toBe(scenario.username);
      if(body.password!==scenario.password)return route.fulfill({status:401,json:{message:'Invalid username or password'}});
      return route.fulfill({json:{status:'success',user,accessToken:'local-access',refreshToken:'local-refresh'}});
    }
    if(url.pathname==='/api/v1/auth/me')return route.fulfill({json:user});
    return route.fulfill({status:404,json:{message:'Local fixture has no course data'}});
  });
  await page.goto('/login');
  await page.getByLabel('User Name',{exact:true}).fill(scenario.username);
  await page.getByRole('button',{name:'Log In',exact:true}).click();
  await expect(page.getByText('Password is required',{exact:true})).toBeVisible();
  expect(submissions).toBe(0);
  const password=page.getByLabel('Password',{exact:true});
  await expect(password).toHaveAttribute('type','password');
  await password.fill('incorrect');
  await page.getByRole('button',{name:'Show password',exact:true}).click();
  await expect(password).toHaveAttribute('type','text');
  await page.getByRole('button',{name:'Hide password',exact:true}).click();
  await page.getByRole('button',{name:'Log In',exact:true}).click();
  await expect(page.getByText('Invalid username or password',{exact:true})).toBeVisible();
  expect(await page.evaluate(()=>localStorage.getItem('accessToken'))).toBeNull();
  await password.fill(scenario.password);
  await page.getByRole('button',{name:'Log In',exact:true}).click();
  await expect(page).toHaveURL(new RegExp(scenario.url+'$'));
  const storage=await page.evaluate(()=>Object.entries(localStorage));
  expect(storage.some(([key,value])=>/password/i.test(key)||value===scenario.password)).toBe(false);
  expect(JSON.parse(storage.find(([key])=>key==='AiTutorUser')![1])).not.toHaveProperty('password');
});

test('phone onboarding uses the authenticated token and canonical account username',async({page})=>{
  const user={id:'phone-fixture',username:'learner',role:'STUDENT',firstName:'Local',lastName:'User',phoneNumber:null,acceptedTerms:true,region:'ROW'};
  let saved=false;
  await page.route('**/api/v1/**',async route=>{
    const req=route.request(),path=new URL(req.url()).pathname;
    if(path==='/api/v1/auth/login')return route.fulfill({json:{status:'success',user,accessToken:'local-access',refreshToken:'local-refresh'}});
    if(path==='/api/v1/auth/add-phone'){
      expect(req.headers().authorization).toBe('Bearer local-access');
      expect(req.postDataJSON()).toEqual({username:'learner',phoneNumber:'0500000000'});
      saved=true;return route.fulfill({json:{status:'success',user:{...user,phoneNumber:'0500000000'}}});
    }
    if(path==='/api/v1/auth/me')return route.fulfill({json:user});
    return route.fulfill({status:404,json:{message:'No fixture content'}});
  });
  await page.goto('/login');
  await page.getByLabel('User Name',{exact:true}).fill('LEARNER');
  await page.getByLabel('Password',{exact:true}).fill('Student123');
  await page.getByRole('button',{name:'Log In',exact:true}).click();
  await page.getByLabel('Phone Number',{exact:true}).fill('0500000000');
  await page.getByRole('button',{name:'Add Number',exact:true}).click();
  await expect(page).toHaveURL(/\/student\/courses$/);
  expect(saved).toBe(true);
});

const $btnSignIn= document.querySelector('.sign_in_button'),
      $btnSignUp = document.querySelector('.sign_up_button'),  
      $signUp = document.querySelector('.sign_up'),
      $signIn  = document.querySelector('.sign_in');

      document.addEventListener('click', e => {
        if (e.target === $btnSignIn || e.target === $btnSignUp) {
            $signIn.classList.toggle('active');
            $signUp.classList.toggle('active')
        }
    });

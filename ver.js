document.getElementById("verificationForm").addEventListener("submit", function(e) {
  e.preventDefault();

  // collect code
  const digits = Array.from(document.querySelectorAll(".code-inputs input"))
                      .map(input => input.value)
                      .join("");

  if (digits.length === 6) {
    alert("Code Verified Successfully! 🎉");
    // redirect to dashboard or login
    window.location.href = "login.html";
  } else {
    alert("Please enter the full 6-digit code.");
  }
});

// auto-focus to next input
document.querySelectorAll(".code-inputs input").forEach((input, idx, arr) => {
  input.addEventListener("input", () => {
    if (input.value && idx < arr.length - 1) {
      arr[idx + 1].focus();
    }
  });
});

document.getElementById("resendCode").addEventListener("click", (e) => {
  e.preventDefault();
  alert("A new verification code has been sent to your email.");
});

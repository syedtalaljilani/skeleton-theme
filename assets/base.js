// Utility functions
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

const throttle = (func, limit) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Header scroll behavior
const header = document.querySelector("[data-header]");
let lastScroll = 0;

const handleScroll = throttle(() => {
  const currentScroll = window.pageYOffset;

  if (currentScroll <= 0) {
    header.classList.remove("header--hidden");
    return;
  }

  if (
    currentScroll > lastScroll &&
    !header.classList.contains("header--hidden")
  ) {
    // Scrolling down
    header.classList.add("header--hidden");
  } else if (
    currentScroll < lastScroll &&
    header.classList.contains("header--hidden")
  ) {
    // Scrolling up
    header.classList.remove("header--hidden");
  }

  lastScroll = currentScroll;
}, 100);

window.addEventListener("scroll", handleScroll);

// Mobile menu
const mobileMenuButton = document.querySelector("[data-mobile-menu-button]");
const nav = document.querySelector("[data-nav]");

if (mobileMenuButton && nav) {
  mobileMenuButton.addEventListener("click", () => {
    nav.classList.toggle("is-active");
    mobileMenuButton.setAttribute(
      "aria-expanded",
      mobileMenuButton.getAttribute("aria-expanded") === "true"
        ? "false"
        : "true"
    );
  });

  // Close mobile menu when clicking outside
  document.addEventListener("click", (event) => {
    if (
      !nav.contains(event.target) &&
      !mobileMenuButton.contains(event.target)
    ) {
      nav.classList.remove("is-active");
      mobileMenuButton.setAttribute("aria-expanded", "false");
    }
  });

  // Close mobile menu when clicking a link
  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("is-active");
      mobileMenuButton.setAttribute("aria-expanded", "false");
    });
  });
}

// Search modal
const searchButton = document.querySelector("[data-search-button]");
const searchModal = document.querySelector("[data-search-modal]");
const searchClose = document.querySelector("[data-search-close]");

if (searchButton && searchModal && searchClose) {
  searchButton.addEventListener("click", () => {
    searchModal.classList.add("is-active");
    document.body.style.overflow = "hidden";
  });

  searchClose.addEventListener("click", () => {
    searchModal.classList.remove("is-active");
    document.body.style.overflow = "";
  });

  // Close search modal when clicking outside
  searchModal.addEventListener("click", (event) => {
    if (event.target === searchModal) {
      searchModal.classList.remove("is-active");
      document.body.style.overflow = "";
    }
  });
}

// Lazy loading images
const lazyLoadImages = () => {
  const images = document.querySelectorAll('img[loading="lazy"]');

  if ("IntersectionObserver" in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const image = entry.target;
          image.src = image.dataset.src;
          image.classList.add("loaded");
          observer.unobserve(image);
        }
      });
    });

    images.forEach((image) => imageObserver.observe(image));
  } else {
    // Fallback for browsers that don't support IntersectionObserver
    images.forEach((image) => {
      image.src = image.dataset.src;
      image.classList.add("loaded");
    });
  }
};

// Initialize lazy loading
document.addEventListener("DOMContentLoaded", lazyLoadImages);

// Form handling
const forms = document.querySelectorAll("form[data-ajax]");

forms.forEach((form) => {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const submitButton = form.querySelector('[type="submit"]');
    const originalText = submitButton.textContent;

    try {
      submitButton.disabled = true;
      submitButton.textContent = "Loading...";

      const formData = new FormData(form);
      const response = await fetch(form.action, {
        method: form.method,
        body: formData,
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) throw new Error("Network response was not ok");

      const data = await response.json();

      if (data.success) {
        form.reset();
        // Handle success (e.g., show success message)
      } else {
        // Handle error
        throw new Error(data.message || "Something went wrong");
      }
    } catch (error) {
      console.error("Error:", error);
      // Handle error (e.g., show error message)
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = originalText;
    }
  });
});

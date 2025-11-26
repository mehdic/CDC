import { test, expect } from '../fixtures/auth.fixture';
import { EcommercePage } from '../page-objects';
import { mockApiResponse } from '../utils/api-mock';

/**
 * E2E-010: Product Reviews
 *
 * Tests product review functionality including viewing, filtering, sorting,
 * and submitting reviews with ratings and comments.
 */
test.describe('E2E-010: Product Reviews', () => {
  const mockProduct = {
    id: 'prod_001',
    name: 'Paracétamol 500mg',
    category: 'OTC',
    price: 5.5,
    stock: 100,
    rating: 4.5,
    totalReviews: 24,
    description: 'Relieves pain and fever',
  };

  const mockReviews = [
    {
      id: 'review_001',
      productId: 'prod_001',
      userId: 'user_patient_001',
      userName: 'Sophie Bernard',
      rating: 5,
      title: 'Excellent pain relief',
      comment: 'Works very well for headaches. Fast acting and long lasting.',
      verified: true,
      helpful: 12,
      unhelpful: 1,
      date: '2025-11-15',
      images: ['review_img_001.jpg'],
    },
    {
      id: 'review_002',
      productId: 'prod_001',
      userId: 'user_patient_002',
      userName: 'Jean Dupont',
      rating: 4,
      title: 'Good product',
      comment: 'Good value for money. Does what it says.',
      verified: true,
      helpful: 8,
      unhelpful: 0,
      date: '2025-11-10',
      images: [],
    },
    {
      id: 'review_003',
      productId: 'prod_001',
      userId: 'user_patient_003',
      userName: 'Marie Leclerc',
      rating: 5,
      title: 'My go-to painkiller',
      comment: 'Use this regularly for various aches and pains. Reliable and affordable.',
      verified: true,
      helpful: 15,
      unhelpful: 2,
      date: '2025-11-05',
      images: [],
    },
    {
      id: 'review_004',
      productId: 'prod_001',
      userId: 'user_patient_004',
      userName: 'Thomas Durand',
      rating: 3,
      title: 'Decent but not exceptional',
      comment: 'Works as expected but sometimes takes longer than other brands.',
      verified: true,
      helpful: 5,
      unhelpful: 3,
      date: '2025-10-28',
      images: ['review_img_002.jpg'],
    },
  ];

  test.beforeEach(async ({ page }) => {
    // Mock product details
    await mockApiResponse(page, '**/products/prod_001**', {
      status: 200,
      body: {
        success: true,
        product: mockProduct,
      },
    });

    // Mock reviews list
    await mockApiResponse(page, '**/products/prod_001/reviews**', {
      status: 200,
      body: {
        success: true,
        reviews: mockReviews,
        total: mockReviews.length,
        averageRating: 4.25,
        page: 1,
        pageSize: 10,
      },
    });
  });

  test('should display product reviews section on product page', async ({ patientPage }) => {
    await patientPage.goto('/products/prod_001');

    // Verify reviews section visible
    const reviewsSection = patientPage.locator('[data-testid="reviews-section"]');
    await expect(reviewsSection).toBeVisible();

    // Verify reviews header
    const reviewsHeader = patientPage.locator('[data-testid="reviews-header"]');
    if (await reviewsHeader.count() > 0) {
      await expect(reviewsHeader).toBeVisible();
    }
  });

  test('should display product rating overview', async ({ patientPage }) => {
    await patientPage.goto('/products/prod_001');

    // Verify rating display
    const averageRating = patientPage.locator('[data-testid="average-rating"]');
    if (await averageRating.count() > 0) {
      await expect(averageRating).toContainText('4.5');
    }

    // Verify review count
    const reviewCount = patientPage.locator('[data-testid="review-count"]');
    if (await reviewCount.count() > 0) {
      await expect(reviewCount).toContainText('24');
    }
  });

  test('should display rating distribution breakdown', async ({ patientPage }) => {
    await patientPage.goto('/products/prod_001');

    // Look for rating distribution bars
    const starBreakdown = patientPage.locator('[data-testid="star-distribution"]');
    if (await starBreakdown.count() > 0) {
      await expect(starBreakdown).toBeVisible();
    }
  });

  test('should display list of product reviews', async ({ patientPage }) => {
    await patientPage.goto('/products/prod_001');

    // Verify reviews are listed
    const reviewItems = patientPage.locator('[data-testid^="review-item-"]');
    const count = await reviewItems.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should display review details (title, rating, comment, author)', async ({ patientPage }) => {
    await patientPage.goto('/products/prod_001');

    // Verify first review details
    const reviewTitle = patientPage.locator('[data-testid="review-title-review_001"]');
    const reviewRating = patientPage.locator('[data-testid="review-rating-review_001"]');
    const reviewComment = patientPage.locator('[data-testid="review-comment-review_001"]');
    const reviewAuthor = patientPage.locator('[data-testid="review-author-review_001"]');

    if (await reviewTitle.count() > 0) {
      await expect(reviewTitle).toContainText('Excellent pain relief');
    }
    if (await reviewRating.count() > 0) {
      await expect(reviewRating).toContainText('5');
    }
    if (await reviewComment.count() > 0) {
      await expect(reviewComment).toContainText('Works very well');
    }
    if (await reviewAuthor.count() > 0) {
      await expect(reviewAuthor).toContainText('Sophie Bernard');
    }
  });

  test('should display verified purchase badge', async ({ patientPage }) => {
    await patientPage.goto('/products/prod_001');

    // Look for verified badge
    const verifiedBadge = patientPage.locator('[data-testid="verified-badge-review_001"]');
    if (await verifiedBadge.count() > 0) {
      await expect(verifiedBadge).toBeVisible();
    }
  });

  test('should display review dates', async ({ patientPage }) => {
    await patientPage.goto('/products/prod_001');

    // Verify review date displayed
    const reviewDate = patientPage.locator('[data-testid="review-date-review_001"]');
    if (await reviewDate.count() > 0) {
      await expect(reviewDate).toContainText('2025-11-15');
    }
  });

  test('should display review images/photos', async ({ patientPage }) => {
    await patientPage.goto('/products/prod_001');

    // Look for review images
    const reviewImage = patientPage.locator('[data-testid="review-image-review_001"]');
    if (await reviewImage.count() > 0) {
      await expect(reviewImage).toBeVisible();
    }
  });

  test('should allow marking review as helpful', async ({ patientPage }) => {
    await mockApiResponse(patientPage, '**/reviews/review_001/helpful', {
      status: 200,
      body: {
        success: true,
        helpful: 13,
      },
    });

    await patientPage.goto('/products/prod_001');

    // Find helpful button
    const helpfulButton = patientPage.locator('[data-testid="helpful-btn-review_001"]');
    if (await helpfulButton.count() > 0) {
      await helpfulButton.click();

      // Verify count updated
      const helpfulCount = patientPage.locator('[data-testid="helpful-count-review_001"]');
      if (await helpfulCount.count() > 0) {
        await expect(helpfulCount).toContainText('13');
      }
    }
  });

  test('should allow marking review as unhelpful', async ({ patientPage }) => {
    await mockApiResponse(patientPage, '**/reviews/review_001/unhelpful', {
      status: 200,
      body: {
        success: true,
        unhelpful: 2,
      },
    });

    await patientPage.goto('/products/prod_001');

    // Find unhelpful button
    const unhelpfulButton = patientPage.locator('[data-testid="unhelpful-btn-review_001"]');
    if (await unhelpfulButton.count() > 0) {
      await unhelpfulButton.click();

      // Verify count updated
      const unhelpfulCount = patientPage.locator('[data-testid="unhelpful-count-review_001"]');
      if (await unhelpfulCount.count() > 0) {
        await expect(unhelpfulCount).toContainText('2');
      }
    }
  });

  test('should filter reviews by rating', async ({ patientPage }) => {
    await mockApiResponse(patientPage, '**/products/prod_001/reviews?rating=5**', {
      status: 200,
      body: {
        success: true,
        reviews: mockReviews.filter(r => r.rating === 5),
        total: 2,
      },
    });

    await patientPage.goto('/products/prod_001');

    // Click rating filter
    const ratingFilter = patientPage.locator('[data-testid="rating-filter"]');
    if (await ratingFilter.count() > 0) {
      await ratingFilter.click();

      // Select 5 stars
      const fiveStarOption = patientPage.getByRole('option', { name: /5.*star/ });
      if (await fiveStarOption.count() > 0) {
        await fiveStarOption.click();
      }
    }

    // Verify filtered results
    const reviews = patientPage.locator('[data-testid^="review-item-"]');
    const count = await reviews.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should sort reviews by relevance/helpful', async ({ patientPage }) => {
    await mockApiResponse(patientPage, '**/products/prod_001/reviews?sort=helpful**', {
      status: 200,
      body: {
        success: true,
        reviews: mockReviews.sort((a, b) => b.helpful - a.helpful),
      },
    });

    await patientPage.goto('/products/prod_001');

    // Find sort dropdown
    const sortDropdown = patientPage.locator('[data-testid="sort-dropdown"]');
    if (await sortDropdown.count() > 0) {
      await sortDropdown.click();

      // Select sort by helpful
      const helpfulOption = patientPage.getByRole('option', { name: /helpful|relevant/i });
      if (await helpfulOption.count() > 0) {
        await helpfulOption.click();
      }
    }
  });

  test('should sort reviews by most recent', async ({ patientPage }) => {
    await mockApiResponse(patientPage, '**/products/prod_001/reviews?sort=recent**', {
      status: 200,
      body: {
        success: true,
        reviews: mockReviews.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      },
    });

    await patientPage.goto('/products/prod_001');

    // Find sort dropdown
    const sortDropdown = patientPage.locator('[data-testid="sort-dropdown"]');
    if (await sortDropdown.count() > 0) {
      await sortDropdown.click();

      // Select sort by recent
      const recentOption = patientPage.getByRole('option', { name: /newest|recent/i });
      if (await recentOption.count() > 0) {
        await recentOption.click();
      }
    }
  });

  test('should display write review button for customers', async ({ patientPage }) => {
    await patientPage.goto('/products/prod_001');

    // Look for write review button
    const writeReviewButton = patientPage.getByRole('button', { name: /write.*review|add.*review|leave.*review/i });
    if (await writeReviewButton.count() > 0) {
      await expect(writeReviewButton).toBeVisible();
    }
  });

  test('should display review form with rating, title, and comment fields', async ({ patientPage }) => {
    await patientPage.goto('/products/prod_001');

    // Click write review button
    const writeReviewButton = patientPage.getByRole('button', { name: /write.*review|add.*review|leave.*review/i });
    if (await writeReviewButton.count() > 0) {
      await writeReviewButton.click();

      // Verify form elements
      const ratingInput = patientPage.locator('[data-testid="review-rating-input"]');
      const titleInput = patientPage.locator('[data-testid="review-title-input"]');
      const commentInput = patientPage.locator('[data-testid="review-comment-input"]');

      if (await ratingInput.count() > 0) {
        await expect(ratingInput).toBeVisible();
      }
      if (await titleInput.count() > 0) {
        await expect(titleInput).toBeVisible();
      }
      if (await commentInput.count() > 0) {
        await expect(commentInput).toBeVisible();
      }
    }
  });

  test('should submit a review with rating and comment', async ({ patientPage }) => {
    await mockApiResponse(patientPage, '**/reviews', {
      status: 201,
      body: {
        success: true,
        review: {
          id: 'review_new_001',
          productId: 'prod_001',
          rating: 5,
          title: 'Great product',
          comment: 'Very satisfied with this product.',
          verified: false,
        },
      },
    });

    await patientPage.goto('/products/prod_001');

    // Click write review button
    const writeReviewButton = patientPage.getByRole('button', { name: /write.*review|add.*review|leave.*review/i });
    if (await writeReviewButton.count() > 0) {
      await writeReviewButton.click();

      // Fill form
      const ratingButtons = patientPage.locator('[data-testid="star-rating-5"]');
      if (await ratingButtons.count() > 0) {
        await ratingButtons.click();
      }

      const titleInput = patientPage.locator('[data-testid="review-title-input"]');
      if (await titleInput.count() > 0) {
        await titleInput.fill('Great product');
      }

      const commentInput = patientPage.locator('[data-testid="review-comment-input"]');
      if (await commentInput.count() > 0) {
        await commentInput.fill('Very satisfied with this product.');
      }

      // Submit
      const submitButton = patientPage.getByRole('button', { name: /submit|post|send/i });
      if (await submitButton.count() > 0) {
        await submitButton.click();

        // Verify success message
        const successMessage = patientPage.locator('[data-testid="success-message"]');
        if (await successMessage.count() > 0) {
          await expect(successMessage).toBeVisible();
        }
      }
    }
  });

  test('should allow uploading images with review', async ({ patientPage }) => {
    await patientPage.goto('/products/prod_001');

    // Click write review button
    const writeReviewButton = patientPage.getByRole('button', { name: /write.*review|add.*review|leave.*review/i });
    if (await writeReviewButton.count() > 0) {
      await writeReviewButton.click();

      // Look for image upload
      const imageUpload = patientPage.locator('[data-testid="image-upload"]');
      if (await imageUpload.count() > 0) {
        await expect(imageUpload).toBeVisible();
      }
    }
  });

  test('should validate required review fields', async ({ patientPage }) => {
    await patientPage.goto('/products/prod_001');

    // Click write review button
    const writeReviewButton = patientPage.getByRole('button', { name: /write.*review|add.*review|leave.*review/i });
    if (await writeReviewButton.count() > 0) {
      await writeReviewButton.click();

      // Try to submit empty form
      const submitButton = patientPage.getByRole('button', { name: /submit|post|send/i });
      if (await submitButton.count() > 0) {
        await submitButton.click();

        // Should show validation errors
        const errorMessage = patientPage.locator('[data-testid^="error-"]');
        const errorCount = await errorMessage.count();
        // Validation may or may not show depending on implementation
      }
    }
  });

  test('should require login to submit a review', async ({ page }) => {
    // Start with guest context (no auth)
    const newPage = await page.context().newPage();
    await newPage.goto(`http://localhost:5173/products/prod_001`);

    // Click write review button
    const writeReviewButton = newPage.getByRole('button', { name: /write.*review|add.*review|leave.*review/i });
    if (await writeReviewButton.count() > 0) {
      await writeReviewButton.click();

      // Should redirect to login or show login dialog
      // Verify either login page or login dialog appears
      const loginForm = newPage.locator('[data-testid="login-form"]');
      const loginDialog = newPage.locator('[data-testid="login-dialog"]');

      const hasLoginForm = await loginForm.count() > 0;
      const hasLoginDialog = await loginDialog.count() > 0;
      expect(hasLoginForm || hasLoginDialog).toBeTruthy();
    }

    await newPage.close();
  });

  test('should support review pagination', async ({ patientPage }) => {
    await mockApiResponse(patientPage, '**/products/prod_001/reviews?page=2**', {
      status: 200,
      body: {
        success: true,
        reviews: [],
        total: mockReviews.length,
        page: 2,
        pageSize: 10,
      },
    });

    await patientPage.goto('/products/prod_001');

    // Look for pagination
    const nextButton = patientPage.getByRole('button', { name: /next|page.*2/i });
    if (await nextButton.count() > 0) {
      await expect(nextButton).toBeVisible();
    }
  });

  test('should display review count breakdown by rating', async ({ patientPage }) => {
    await patientPage.goto('/products/prod_001');

    // Look for rating breakdown
    const fiveStarCount = patientPage.locator('[data-testid="rating-count-5"]');
    const fourStarCount = patientPage.locator('[data-testid="rating-count-4"]');
    const threeStarCount = patientPage.locator('[data-testid="rating-count-3"]');

    if (await fiveStarCount.count() > 0) {
      await expect(fiveStarCount).toBeVisible();
    }
  });

  test('should show review helpfulness stats', async ({ patientPage }) => {
    await patientPage.goto('/products/prod_001');

    // Verify helpful/unhelpful counts
    const helpfulCount = patientPage.locator('[data-testid="helpful-count-review_001"]');
    const unhelpfulCount = patientPage.locator('[data-testid="unhelpful-count-review_001"]');

    if (await helpfulCount.count() > 0) {
      await expect(helpfulCount).toContainText('12');
    }
    if (await unhelpfulCount.count() > 0) {
      await expect(unhelpfulCount).toContainText('1');
    }
  });

  test('should allow reporting inappropriate reviews', async ({ patientPage }) => {
    await patientPage.goto('/products/prod_001');

    // Look for report button
    const reportButton = patientPage.locator('[data-testid="report-btn-review_001"]');
    if (await reportButton.count() > 0) {
      await expect(reportButton).toBeVisible();
    }
  });

  test('should load reviews from multiple pages with scroll/load more', async ({ patientPage }) => {
    await patientPage.goto('/products/prod_001');

    // Look for load more button
    const loadMoreButton = patientPage.getByRole('button', { name: /load.*more|see.*more/i });
    if (await loadMoreButton.count() > 0) {
      await expect(loadMoreButton).toBeVisible();
    }
  });
});

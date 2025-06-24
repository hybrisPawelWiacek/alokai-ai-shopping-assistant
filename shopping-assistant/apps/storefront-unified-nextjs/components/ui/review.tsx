import { type PropsWithStyle, SfRating } from '@storefront-ui/react';
import classNames from 'classnames';
import { useState } from 'react';

export interface ReviewProps extends PropsWithStyle {
  /**
   * Author of the review
   */
  author?: string;
  /**
   * Content of the review
   */
  content?: string;
  /**
   * Date of the review
   */
  date?: string;
  /**
   * Rating of the review
   */
  rating?: number;
  /**
   * Button content to show when the review is collapsed
   */
  showLessText?: string;
  /**
   * Button content to show when the review is expanded
   */
  showMoreText?: string;
  /**
   * Title of the review
   */
  title?: string;
}

export default function Review({
  author,
  className,
  content = '',
  date,
  rating,
  showLessText,
  showMoreText,
  title,
}: ReviewProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const charLimit = 300;
  const isButtonVisible = content.length > charLimit;
  const truncatedContent = isButtonVisible && isCollapsed ? `${content.substring(0, charLimit)}...` : content;

  return (
    <article className={classNames(className, 'w-full rounded-md border p-4')}>
      <p className="pb-2 font-medium">{title}</p>
      <header className="pb-2">
        <div className="flex items-center pr-2 text-xs text-neutral-500" data-testid="review">
          <SfRating className="mr-2" max={5} size="sm" value={rating ?? undefined} />
          <span data-testid="review-date">{date}</span>
        </div>
        <p className="mt-2 truncate text-xs text-neutral-500" data-testid="review-author">
          {author}
        </p>
      </header>
      <div className="pb-2 text-sm text-neutral-900" data-testid="review-text">
        {truncatedContent}
      </div>
      {isButtonVisible ? (
        <button
          className="mb-2 inline-block w-fit cursor-pointer border-b-2 border-black text-sm font-normal hover:border-primary-800 hover:text-primary-700"
          onClick={() => {
            setIsCollapsed((currentState) => !currentState);
          }}
          type="button"
        >
          {isCollapsed ? showMoreText : showLessText}
        </button>
      ) : null}
    </article>
  );
}

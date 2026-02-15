import { Button } from '@heroui/button';
import { Tooltip } from '@heroui/tooltip';
import Link from 'next/link';

export default function DownloadFileButton({ name, url }: { name: string, url: string }) {

  return (
    <Tooltip content={name} placement='top' showArrow closeDelay={0}>
      <Button
        as={Link}
        href={url}
        variant='faded'
        className='flex items-center justify-start'
        target='_blank'
        rel='noopener noreferrer'
        download={name}
      >
        <span className='material-symbols-outlined icon-md'>file_download</span>
        <span className='text-medium font-mormal'>
          {name.split(".")[0].slice(0, 12)}
          {name.length > 20 ? "..." : ""}
          {` (${name.split(".").pop()})`}
        </span>
      </Button>
    </Tooltip>
  );
}

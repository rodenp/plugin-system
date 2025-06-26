// Internal Default Components - NOT exposed to consumers
import { CourseEditor } from './CourseEditor';
import { CourseViewer } from './CourseViewer';
import { CourseList } from './CourseList';
import { CourseCard } from './CourseCard';
import { CreateCourseForm } from './CreateCourseForm';
import { CourseDetails } from './CourseDetails';
// UI Components
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Dialog } from './ui/dialog';
import { Input } from './ui/input';
import { Progress } from './ui/progress';
import { Select } from './ui/select';
import { Switch } from './ui/switch';
import { Tabs } from './ui/tabs';
import { Textarea } from './ui/textarea';
// Export default components object for internal plugin use
export const components = {
    // Course Components
    CourseEditor,
    CourseViewer,
    CourseList,
    CourseCard,
    CreateCourseForm,
    CourseDetails,
    // UI Components
    ui: {
        Badge,
        Button,
        Card,
        Dialog,
        Input,
        Progress,
        Select,
        Switch,
        Tabs,
        Textarea,
    }
};
